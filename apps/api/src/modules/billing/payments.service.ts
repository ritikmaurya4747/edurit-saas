import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { getPagination, paginated } from '../../common/utils/pagination';
import { BillingContextService } from './billing-context.service';
import {
  applyInvoicePayment,
  documentYear,
  formatDocNumber,
  fromPaise,
  isUniqueViolation,
  lastReceiptSeq,
  refundableByAllocation,
  studentName,
  studentSearchWhere,
  toPaise,
  withRetry,
  zonedDayStart,
} from './billing.utils';
import { CreatePaymentDto, CreateRefundDto, PaymentListQueryDto, RefundListQueryDto } from './dto/billing.dto';

const studentSelect = { id: true, firstName: true, lastName: true, admissionNumber: true } as const;
// First allocation → invoice → student: every payment is allocated to one student's invoices.
const paymentStudentInclude = {
  allocations: {
    take: 1,
    orderBy: [{ allocatedAt: 'asc' as const }, { id: 'asc' as const }],
    select: { invoice: { select: { student: { select: studentSelect } } } },
  },
};

const money = (paise: number) => fromPaise(paise).toFixed(2);

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly context: BillingContextService,
  ) {}

  // ------------------------------------------------------------- collect
  async create(user: AuthUser, dto: CreatePaymentDto) {
    const tenantId = user.tenantId;
    const idempotencyKey = dto.idempotencyKey.trim();

    // Replayed request (double click, network retry): return the original receipt.
    const replay = await this.findByIdempotencyKey(tenantId, idempotencyKey);
    if (replay) return this.receipt(tenantId, replay);

    await this.context.requireStudent(tenantId, dto.studentId);
    const { timezone, today, currency } = await this.context.settings(tenantId);
    const paidAt = this.resolvePaidAt(dto.paidAt, timezone, today);
    const amountPaise = toPaise(dto.amount);
    if (amountPaise <= 0) throw new BadRequestException('Amount must be greater than zero');
    const invoiceIds = dto.invoiceIds?.length ? [...new Set(dto.invoiceIds)] : null;

    let result: { paymentId: string; allocations: { invoiceNumber: string; amount: string }[] };
    try {
      result = await withRetry(
        () =>
          this.prisma.$transaction(
            async (tx) => {
              const invoices = await tx.studentInvoice.findMany({
                where: {
                  tenantId,
                  studentId: dto.studentId,
                  deletedAt: null,
                  status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID] },
                  balanceAmount: { gt: 0 },
                  ...(invoiceIds && { id: { in: invoiceIds } }),
                },
                orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }, { invoiceNumber: 'asc' }],
              });
              if (invoiceIds && invoices.length !== invoiceIds.length) {
                throw new BadRequestException('Some selected invoices are already paid, void, or do not belong to this student');
              }
              if (!invoices.length) throw new BadRequestException('This student has no outstanding invoices');

              const outstanding = invoices.reduce((sum, inv) => sum + toPaise(inv.balanceAmount), 0);
              if (amountPaise > outstanding) {
                throw new BadRequestException(
                  `Amount is more than the outstanding balance (${currency} ${money(outstanding)}) of the selected invoices`,
                );
              }

              // Oldest due first.
              let left = amountPaise;
              const plan: { invoice: (typeof invoices)[number]; amount: number }[] = [];
              for (const invoice of invoices) {
                if (left <= 0) break;
                const take = Math.min(left, toPaise(invoice.balanceAmount));
                plan.push({ invoice, amount: take });
                left -= take;
              }

              const prefix = `RCT-${documentYear(timezone)}-`;
              const seq = await lastReceiptSeq(tx, tenantId, prefix);
              const payment = await tx.feePayment.create({
                data: {
                  tenantId,
                  idempotencyKey,
                  receiptNumber: formatDocNumber(prefix, seq + 1),
                  amount: fromPaise(amountPaise),
                  paymentMethod: dto.paymentMethod,
                  gatewayRef: dto.gatewayRef?.trim() || null,
                  remarks: dto.remarks?.trim() || null,
                  collectedById: user.id,
                  paidAt,
                },
              });

              // Distinct, ordered timestamps keep the allocation order for refunds.
              const base = Date.now();
              for (const [i, { invoice, amount }] of plan.entries()) {
                await tx.feePaymentAllocation.create({
                  data: { paymentId: payment.id, invoiceId: invoice.id, allocatedAmount: fromPaise(amount), allocatedAt: new Date(base + i) },
                });
                await applyInvoicePayment(tx, invoice, toPaise(invoice.paidAmount) + amount);
              }
              return {
                paymentId: payment.id,
                allocations: plan.map((p) => ({ invoiceNumber: p.invoice.invoiceNumber, amount: money(p.amount) })),
              };
            },
            { maxWait: 10_000, timeout: 30_000 },
          ),
        'receipt_number',
      );
    } catch (error) {
      // Same idempotency key submitted concurrently: the other request won.
      if (isUniqueViolation(error, 'idempotency')) {
        const winner = await this.findByIdempotencyKey(tenantId, idempotencyKey);
        if (winner) return this.receipt(tenantId, winner);
      }
      throw error;
    }

    await this.audit.log(user, 'CREATE', 'FeePayment', result.paymentId, {
      studentId: dto.studentId,
      amount: money(amountPaise),
      method: dto.paymentMethod,
      allocations: result.allocations,
    });
    return this.receipt(tenantId, result.paymentId);
  }

  // --------------------------------------------------------------- reads
  async list(tenantId: string, query: PaymentListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const { timezone } = await this.context.settings(tenantId);

    const and: Prisma.FeePaymentWhereInput[] = [{ tenantId }];
    if (query.method) and.push({ paymentMethod: query.method });
    if (query.from) and.push({ paidAt: { gte: zonedDayStart(parseDateOnly(query.from), timezone) } });
    if (query.to) and.push({ paidAt: { lt: zonedDayStart(addDays(parseDateOnly(query.to), 1), timezone) } });
    const search = query.search?.trim();
    if (search) {
      const studentWhere = studentSearchWhere(search);
      and.push({
        OR: [
          { receiptNumber: { contains: search, mode: 'insensitive' } },
          ...(studentWhere ? [{ allocations: { some: { invoice: { student: studentWhere } } } }] : []),
        ],
      });
    }
    const where: Prisma.FeePaymentWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        include: { ...paymentStudentInclude, refunds: { select: { amount: true } } },
        orderBy: [{ paidAt: 'desc' }, { receiptNumber: 'desc' }],
        skip,
        take,
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    const data = rows.map(({ allocations, refunds, ...payment }) => {
      const student = allocations[0]?.invoice.student;
      const refundedPaise = refunds.reduce((sum, r) => sum + toPaise(r.amount), 0);
      return {
        ...payment,
        student: student ? { id: student.id, name: studentName(student), admissionNumber: student.admissionNumber } : null,
        refundedAmount: money(refundedPaise),
      };
    });
    return paginated(data, total, page, limit);
  }

  // Printable receipt.
  async receipt(tenantId: string, id: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id, tenantId },
      include: {
        allocations: {
          orderBy: [{ allocatedAt: 'asc' }, { id: 'asc' }],
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                balanceAmount: true,
                status: true,
                dueDate: true,
                student: { select: studentSelect },
              },
            },
          },
        },
        refunds: { orderBy: { processedAt: 'asc' } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const [tenant, settings, collector] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, legalName: true } }),
      this.context.settings(tenantId),
      payment.collectedById
        ? this.prisma.user.findUnique({ where: { id: payment.collectedById }, select: { firstName: true, lastName: true } })
        : null,
    ]);

    // Balance of each invoice right after this payment: total − everything
    // allocated to it up to and including this allocation.
    const invoiceIds = payment.allocations.map((a) => a.invoiceId);
    const history = await this.prisma.feePaymentAllocation.findMany({
      where: { invoiceId: { in: invoiceIds } },
      select: { invoiceId: true, allocatedAmount: true, allocatedAt: true },
    });

    const firstStudent = payment.allocations[0]?.invoice.student;
    const labels = await this.context.sectionLabels(tenantId, firstStudent ? [firstStudent.id] : []);
    const refundedPaise = payment.refunds.reduce((sum, r) => sum + toPaise(r.amount), 0);
    const { allocations, refunds, ...rest } = payment;

    return {
      school: { name: tenant?.legalName || tenant?.name || '', displayName: tenant?.name ?? '', logoUrl: settings.logoUrl },
      currency: settings.currency,
      payment: rest,
      student: firstStudent
        ? {
            id: firstStudent.id,
            name: studentName(firstStudent),
            admissionNumber: firstStudent.admissionNumber,
            sectionLabel: labels.get(firstStudent.id) ?? null,
          }
        : null,
      allocations: allocations.map((a) => {
        const allocatedUpToHere = history
          .filter((h) => h.invoiceId === a.invoiceId && h.allocatedAt.getTime() <= a.allocatedAt.getTime())
          .reduce((sum, h) => sum + toPaise(h.allocatedAmount), 0);
        return {
          invoiceId: a.invoiceId,
          invoiceNumber: a.invoice.invoiceNumber,
          dueDate: a.invoice.dueDate,
          invoiceTotal: a.invoice.totalAmount,
          allocatedAmount: a.allocatedAmount,
          balanceAfter: money(Math.max(toPaise(a.invoice.totalAmount) - allocatedUpToHere, 0)),
          currentBalance: a.invoice.balanceAmount,
          currentStatus: a.invoice.status,
        };
      }),
      collectedBy: collector ? studentName(collector) : null,
      refunds,
      refundedAmount: money(refundedPaise),
      netAmount: money(toPaise(payment.amount) - refundedPaise),
    };
  }

  // ------------------------------------------------------------- refunds
  async refund(user: AuthUser, paymentId: string, dto: CreateRefundDto) {
    const tenantId = user.tenantId;
    const amountPaise = toPaise(dto.amount);
    if (amountPaise <= 0) throw new BadRequestException('Refund amount must be greater than zero');
    const { currency } = await this.context.settings(tenantId);

    const refund = await withRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const payment = await tx.feePayment.findFirst({
              where: { id: paymentId, tenantId },
              include: {
                allocations: {
                  orderBy: [{ allocatedAt: 'asc' }, { id: 'asc' }],
                  include: { invoice: { select: { id: true, version: true, totalAmount: true, paidAmount: true, status: true } } },
                },
                refunds: { select: { amount: true } },
              },
            });
            if (!payment) throw new NotFoundException('Payment not found');

            const refundedPaise = payment.refunds.reduce((sum, r) => sum + toPaise(r.amount), 0);
            const available = toPaise(payment.amount) - refundedPaise;
            if (available <= 0) throw new BadRequestException('This payment has already been fully refunded');
            if (amountPaise > available) {
              throw new BadRequestException(`Only ${currency} ${money(available)} can still be refunded on this receipt`);
            }

            // Unwind allocations newest first.
            const refundable = refundableByAllocation(
              payment.allocations.map((a) => ({ amountPaise: toPaise(a.allocatedAmount) })),
              refundedPaise,
            );
            let left = amountPaise;
            for (let i = payment.allocations.length - 1; i >= 0 && left > 0; i--) {
              const take = Math.min(refundable[i] ?? 0, left);
              if (take <= 0) continue;
              const invoice = payment.allocations[i]!.invoice;
              const paid = toPaise(invoice.paidAmount);
              if (invoice.status === InvoiceStatus.VOID || take > paid) {
                throw new ConflictException('Invoice balances do not match this payment. Please contact support.');
              }
              await applyInvoicePayment(tx, invoice, paid - take);
              left -= take;
            }

            return tx.feeRefund.create({
              data: { paymentId: payment.id, amount: fromPaise(amountPaise), reason: dto.reason.trim(), status: 'COMPLETED' },
            });
          },
          { maxWait: 10_000, timeout: 30_000 },
        ),
      'receipt_number',
    );

    await this.audit.log(user, 'REFUND', 'FeePayment', paymentId, { refundId: refund.id, amount: money(amountPaise), reason: refund.reason });
    return { refund, receipt: await this.receipt(tenantId, paymentId) };
  }

  async listRefunds(tenantId: string, query: RefundListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const and: Prisma.FeeRefundWhereInput[] = [{ payment: { tenantId } }];
    const search = query.search?.trim();
    if (search) {
      const studentWhere = studentSearchWhere(search);
      and.push({
        OR: [
          { reason: { contains: search, mode: 'insensitive' } },
          { payment: { receiptNumber: { contains: search, mode: 'insensitive' } } },
          ...(studentWhere ? [{ payment: { allocations: { some: { invoice: { student: studentWhere } } } } }] : []),
        ],
      });
    }
    const where: Prisma.FeeRefundWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      this.prisma.feeRefund.findMany({
        where,
        include: {
          payment: {
            select: { id: true, receiptNumber: true, amount: true, paymentMethod: true, paidAt: true, ...paymentStudentInclude },
          },
        },
        orderBy: { processedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.feeRefund.count({ where }),
    ]);

    const data = rows.map(({ payment, ...refund }) => {
      const student = payment.allocations[0]?.invoice.student;
      return {
        ...refund,
        payment: {
          id: payment.id,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          method: payment.paymentMethod,
          paidAt: payment.paidAt,
        },
        receiptNumber: payment.receiptNumber,
        student: student ? { id: student.id, name: studentName(student), admissionNumber: student.admissionNumber } : null,
      };
    });
    return paginated(data, total, page, limit);
  }

  // ------------------------------------------------------------- helpers
  private async findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<string | null> {
    const existing = await this.prisma.feePayment.findUnique({
      where: { idempotencyKey },
      select: { id: true, tenantId: true },
    });
    if (!existing) return null;
    if (existing.tenantId !== tenantId) throw new ConflictException('This payment reference has already been used');
    return existing.id;
  }

  // Date-only input = that day in the school timezone (now if it is today).
  private resolvePaidAt(value: string | undefined, timezone: string, today: Date): Date {
    const now = new Date();
    if (!value) return now;
    let paidAt: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const day = parseDateOnly(value);
      paidAt = formatDateOnly(day) === formatDateOnly(today) ? now : new Date(zonedDayStart(day, timezone).getTime() + 12 * 3_600_000);
    } else {
      paidAt = new Date(value);
      if (Number.isNaN(paidAt.getTime())) throw new BadRequestException('Invalid payment date');
    }
    if (paidAt.getTime() > now.getTime() + 5 * 60_000) throw new BadRequestException('Payment date cannot be in the future');
    return paidAt;
  }
}
