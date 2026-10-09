import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { parseDateOnly } from '../../common/utils/date';
import { getPagination, paginated } from '../../common/utils/pagination';
import { BillingContextService } from './billing-context.service';
import {
  addMonthsDateOnly,
  documentYear,
  formatDocNumber,
  fromPaise,
  invoiceStatusFor,
  lastInvoiceSeq,
  percentOf,
  splitEvenly,
  splitRefunds,
  studentName,
  studentSearchWhere,
  toPaise,
  VersionConflictError,
  withRetry,
} from './billing.utils';
import { BulkInvoiceDto, CreateInvoiceDto, InvoiceListQueryDto, VoidInvoiceDto } from './dto/billing.dto';

interface DraftItem {
  title: string;
  unitPaise: number;
  quantity: number;
  discountPaise: number;
  feeComponentId?: string | null;
}

interface DraftInvoice {
  studentId: string;
  academicYearId: string;
  dueDate: Date;
  items: DraftItem[];
  taxPaise: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly context: BillingContextService,
  ) {}

  // ---------------------------------------------------------------- reads
  async list(tenantId: string, query: InvoiceListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const { today } = await this.context.settings(tenantId);

    const and: Prisma.StudentInvoiceWhereInput[] = [{ tenantId, deletedAt: null }];
    if (query.academicYearId) and.push({ academicYearId: query.academicYearId });
    if (query.status) and.push({ status: query.status });
    if (query.studentId) and.push({ studentId: query.studentId });
    if (query.sectionId || query.classId) {
      and.push({
        student: {
          enrollments: {
            some: {
              academicYear: { isCurrent: true },
              ...(query.sectionId ? { sectionId: query.sectionId } : { section: { classId: query.classId } }),
            },
          },
        },
      });
    }
    if (query.overdue) {
      and.push({ balanceAmount: { gt: 0 }, dueDate: { lt: today }, status: { not: InvoiceStatus.VOID } });
    }
    const search = query.search?.trim();
    if (search) {
      const studentWhere = studentSearchWhere(search);
      and.push({
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          ...(studentWhere ? [{ student: studentWhere }] : []),
        ],
      });
    }
    const where: Prisma.StudentInvoiceWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      this.prisma.studentInvoice.findMany({
        where,
        include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
        orderBy: [{ createdAt: 'desc' }, { invoiceNumber: 'desc' }],
        skip,
        take,
      }),
      this.prisma.studentInvoice.count({ where }),
    ]);
    const labels = await this.context.sectionLabels(tenantId, rows.map((r) => r.studentId));

    const data = rows.map(({ student, ...invoice }) => ({
      ...invoice,
      student: { id: student.id, name: studentName(student), admissionNumber: student.admissionNumber },
      sectionLabel: labels.get(student.id) ?? null,
      isOverdue: this.isOverdue(invoice, today),
    }));
    return paginated(data, total, page, limit);
  }

  async get(tenantId: string, id: string) {
    const invoice = await this.prisma.studentInvoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: true,
        academicYear: { select: { id: true, name: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        allocations: {
          orderBy: [{ allocatedAt: 'asc' }, { id: 'asc' }],
          include: {
            payment: {
              select: {
                id: true,
                receiptNumber: true,
                paymentMethod: true,
                paidAt: true,
                amount: true,
                gatewayRef: true,
                allocations: {
                  select: { id: true, invoiceId: true, allocatedAmount: true },
                  orderBy: [{ allocatedAt: 'asc' }, { id: 'asc' }],
                },
                refunds: { orderBy: { processedAt: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const { today } = await this.context.settings(tenantId);
    const labels = await this.context.sectionLabels(tenantId, [invoice.studentId]);

    // Refunds unwind allocations in reverse order; work out which part of each
    // refund came off this invoice.
    const refunds = invoice.allocations.flatMap(({ payment }) => {
      const allocs = payment.allocations.map((a) => ({ amountPaise: toPaise(a.allocatedAmount) }));
      const index = payment.allocations.findIndex((a) => a.invoiceId === invoice.id);
      const portions = splitRefunds(allocs, payment.refunds.map((r) => toPaise(r.amount)));
      return payment.refunds
        .map((refund, i) => ({
          id: refund.id,
          paymentId: payment.id,
          receiptNumber: payment.receiptNumber,
          reason: refund.reason,
          status: refund.status,
          processedAt: refund.processedAt,
          refundAmount: refund.amount,
          amount: fromPaise(portions[i]?.[index] ?? 0).toFixed(2),
        }))
        .filter((r) => toPaise(r.amount) > 0);
    });

    const { student, allocations, ...rest } = invoice;
    return {
      ...rest,
      isOverdue: this.isOverdue(invoice, today),
      student: {
        id: student.id,
        name: studentName(student),
        admissionNumber: student.admissionNumber,
        sectionLabel: labels.get(student.id) ?? null,
      },
      allocations: allocations.map((a) => ({
        id: a.id,
        allocatedAmount: a.allocatedAmount,
        allocatedAt: a.allocatedAt,
        payment: {
          id: a.payment.id,
          receiptNumber: a.payment.receiptNumber,
          method: a.payment.paymentMethod,
          paidAt: a.payment.paidAt,
          amount: a.payment.amount,
          gatewayRef: a.payment.gatewayRef,
        },
      })),
      refunds,
    };
  }

  // --------------------------------------------------------------- writes
  async create(user: AuthUser, dto: CreateInvoiceDto) {
    const tenantId = user.tenantId;
    await this.context.requireStudent(tenantId, dto.studentId);
    const academicYearId = await this.context.requireYearId(tenantId, dto.academicYearId);
    const { currency, timezone } = await this.context.settings(tenantId);

    const componentIds = [...new Set(dto.items.map((i) => i.feeComponentId).filter((v): v is string => !!v))];
    if (componentIds.length) {
      const found = await this.prisma.feeComponent.count({
        where: { id: { in: componentIds }, feeStructure: { tenantId } },
      });
      if (found !== componentIds.length) throw new BadRequestException('One or more fee components were not found');
    }

    const draft: DraftInvoice = {
      studentId: dto.studentId,
      academicYearId,
      dueDate: parseDateOnly(dto.dueDate),
      taxPaise: toPaise(dto.taxTotal ?? 0),
      items: dto.items.map((item) => {
        const unitPaise = toPaise(item.unitAmount);
        const quantity = item.quantity ?? 1;
        const discountPaise = toPaise(item.discountAmount ?? 0);
        if (discountPaise > unitPaise * quantity) {
          throw new BadRequestException(`Discount on "${item.title}" is more than the item amount`);
        }
        return { title: item.title.trim(), unitPaise, quantity, discountPaise, feeComponentId: item.feeComponentId ?? null };
      }),
    };

    const [invoice] = await withRetry(
      () =>
        this.prisma.$transaction(async (tx) => {
          const prefix = `INV-${documentYear(timezone)}-`;
          const seq = await lastInvoiceSeq(tx, tenantId, prefix);
          return [await this.insertInvoice(tx, tenantId, currency, formatDocNumber(prefix, seq + 1), draft)];
        }),
      'invoice_number',
    );

    await this.audit.log(user, 'CREATE', 'StudentInvoice', invoice.id, {
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      totalAmount: invoice.totalAmount.toFixed(2),
    });
    return this.get(tenantId, invoice.id);
  }

  async bulkCreate(user: AuthUser, dto: BulkInvoiceDto) {
    const tenantId = user.tenantId;
    if (!dto.classId && !dto.sectionId) throw new BadRequestException('Choose a class or a section to bill');

    const structure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, tenantId, deletedAt: null },
      include: { components: { orderBy: { name: 'asc' } } },
    });
    if (!structure) throw new NotFoundException('Fee structure not found');
    if (!structure.components.length) throw new BadRequestException('This fee structure has no components');

    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, tenantId, deletedAt: null } });
      if (!section) throw new NotFoundException('Section not found');
      if (dto.classId && section.classId !== dto.classId) {
        throw new BadRequestException('The selected section does not belong to the selected class');
      }
    } else if (dto.classId) {
      const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, tenantId, deletedAt: null } });
      if (!cls) throw new NotFoundException('Class not found');
    }

    // Students enrolled (in the structure's academic year) in the chosen section / class.
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId,
        academicYearId: structure.academicYearId,
        ...(dto.sectionId ? { sectionId: dto.sectionId } : { section: { classId: dto.classId, deletedAt: null } }),
        student: { deletedAt: null, status: 'ACTIVE' },
      },
      select: { studentId: true },
    });
    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
    if (!studentIds.length) return { created: 0, skipped: 0, students: 0 };

    const installments = dto.installments ?? 1;
    const discountPercent = dto.discountPercent ?? 0;
    const firstDue = parseDateOnly(dto.dueDate);
    const dueDates = Array.from({ length: installments }, (_, i) => addMonthsDateOnly(firstDue, i));

    // Pre-computed line items per installment (paise).
    const itemsByInstallment: DraftItem[][] = dueDates.map(() => []);
    for (const component of structure.components) {
      const parts = splitEvenly(toPaise(component.amount), installments);
      parts.forEach((part, i) => {
        const title = installments > 1 ? `${component.name} (${i + 1}/${installments})` : component.name;
        itemsByInstallment[i]!.push({
          title: title.slice(0, 128),
          unitPaise: part,
          quantity: 1,
          discountPaise: percentOf(part, discountPercent),
          feeComponentId: component.id,
        });
      });
    }

    // Already billed: a non-void invoice with items from this structure on the same due date.
    const existing = await this.prisma.studentInvoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: InvoiceStatus.VOID },
        studentId: { in: studentIds },
        dueDate: { in: dueDates },
        items: { some: { feeComponentId: { in: structure.components.map((c) => c.id) } } },
      },
      select: { studentId: true, dueDate: true },
    });
    const billed = new Set(existing.map((e) => `${e.studentId}|${e.dueDate.getTime()}`));

    const drafts: DraftInvoice[] = [];
    let skipped = 0;
    for (const studentId of studentIds) {
      dueDates.forEach((dueDate, i) => {
        if (billed.has(`${studentId}|${dueDate.getTime()}`)) {
          skipped++;
          return;
        }
        drafts.push({ studentId, academicYearId: structure.academicYearId, dueDate, items: itemsByInstallment[i]!, taxPaise: 0 });
      });
    }
    if (!drafts.length) return { created: 0, skipped, students: studentIds.length };

    const { currency, timezone } = await this.context.settings(tenantId);
    const created = await withRetry(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const prefix = `INV-${documentYear(timezone)}-`;
            let seq = await lastInvoiceSeq(tx, tenantId, prefix);
            const ids: string[] = [];
            for (const draft of drafts) {
              seq += 1;
              const invoice = await this.insertInvoice(tx, tenantId, currency, formatDocNumber(prefix, seq), draft);
              ids.push(invoice.id);
            }
            return ids;
          },
          { maxWait: 10_000, timeout: 120_000 },
        ),
      'invoice_number',
    );

    await this.audit.log(user, 'BULK_CREATE', 'StudentInvoice', null, {
      feeStructureId: structure.id,
      classId: dto.classId ?? null,
      sectionId: dto.sectionId ?? null,
      dueDate: dto.dueDate,
      installments,
      discountPercent,
      created: created.length,
      skipped,
    });
    return { created: created.length, skipped, students: studentIds.length };
  }

  async void(user: AuthUser, id: string, dto: VoidInvoiceDto) {
    const invoice = await withRetry(async () => {
      const current = await this.prisma.studentInvoice.findFirst({ where: { id, tenantId: user.tenantId, deletedAt: null } });
      if (!current) throw new NotFoundException('Invoice not found');
      if (current.status === InvoiceStatus.VOID) throw new BadRequestException('This invoice is already void');
      if (toPaise(current.paidAmount) > 0) {
        throw new BadRequestException('Invoices with payments cannot be voided. Refund the payments first.');
      }
      // Optimistic concurrency: fails if a payment landed meanwhile.
      const result = await this.prisma.studentInvoice.updateMany({
        where: { id, version: current.version },
        data: { status: InvoiceStatus.VOID, balanceAmount: fromPaise(0), version: { increment: 1 } },
      });
      if (result.count === 0) throw new VersionConflictError();
      return current;
    }, 'invoice_number');

    await this.audit.log(user, 'VOID', 'StudentInvoice', id, {
      invoiceNumber: invoice.invoiceNumber,
      reason: dto.reason.trim(),
      totalAmount: invoice.totalAmount.toFixed(2),
    });
    return this.get(user.tenantId, id);
  }

  // -------------------------------------------------------------- helpers
  private isOverdue(invoice: { balanceAmount: Prisma.Decimal; dueDate: Date; status: InvoiceStatus }, today: Date) {
    return invoice.status !== InvoiceStatus.VOID && toPaise(invoice.balanceAmount) > 0 && invoice.dueDate < today;
  }

  private insertInvoice(
    tx: Prisma.TransactionClient,
    tenantId: string,
    currency: string,
    invoiceNumber: string,
    draft: DraftInvoice,
  ) {
    let subtotal = 0;
    let discountTotal = 0;
    const items = draft.items.map((item) => {
      const gross = item.unitPaise * item.quantity;
      subtotal += gross;
      discountTotal += item.discountPaise;
      return {
        title: item.title,
        unitAmount: fromPaise(item.unitPaise),
        quantity: item.quantity,
        discountAmount: fromPaise(item.discountPaise),
        totalAmount: fromPaise(gross - item.discountPaise),
        feeComponentId: item.feeComponentId ?? null,
      };
    });
    const total = subtotal - discountTotal + draft.taxPaise;
    if (total < 0) throw new BadRequestException('Invoice total cannot be negative');

    return tx.studentInvoice.create({
      data: {
        tenantId,
        studentId: draft.studentId,
        academicYearId: draft.academicYearId,
        invoiceNumber,
        currency,
        subtotal: fromPaise(subtotal),
        discountTotal: fromPaise(discountTotal),
        taxTotal: fromPaise(draft.taxPaise),
        totalAmount: fromPaise(total),
        paidAmount: fromPaise(0),
        balanceAmount: fromPaise(total),
        status: invoiceStatusFor(total, 0),
        dueDate: draft.dueDate,
        items: { create: items },
      },
    });
  }
}

