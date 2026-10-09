import { Injectable } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { BillingContextService } from './billing-context.service';
import { DAY_MS, fromPaise, paiseToNumber, studentName, toPaise, zonedDayStart, zonedMonthKey } from './billing.utils';
import { DefaultersQueryDto } from './dto/billing.dto';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class FeeReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: BillingContextService,
  ) {}

  // Fee dashboard numbers. Year-scoped figures (invoiced / collected /
  // outstanding / overdue / byMethod) use the invoices of the academic year;
  // collected = paid on invoices, which is already net of refunds.
  // Today / month / trend are school-wide cash flow (payments − refunds).
  async summary(tenantId: string, academicYearId?: string) {
    const { currency, timezone, today } = await this.context.settings(tenantId);
    const yearId = await this.context.yearIdOrCurrent(tenantId, academicYearId);

    const invoiceWhere: Prisma.StudentInvoiceWhereInput = {
      tenantId,
      deletedAt: null,
      status: { not: InvoiceStatus.VOID },
      ...(yearId && { academicYearId: yearId }),
    };
    const overdueWhere: Prisma.StudentInvoiceWhereInput = { ...invoiceWhere, balanceAmount: { gt: 0 }, dueDate: { lt: today } };

    // Windows in the school's timezone.
    const dayStart = zonedDayStart(today, timezone);
    const monthStart = zonedDayStart(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)), timezone);
    const trendMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - i), 1));
      return {
        month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
        label: `${MONTH_LABELS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
        start: d,
      };
    });
    const trendStart = zonedDayStart(trendMonths[0]!.start, timezone);

    const [totals, overdue, byMethod, payments, refunds] = await Promise.all([
      this.prisma.studentInvoice.aggregate({
        where: invoiceWhere,
        _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
      }),
      this.prisma.studentInvoice.aggregate({ where: overdueWhere, _sum: { balanceAmount: true }, _count: { _all: true } }),
      this.prisma.feePayment.groupBy({
        by: ['paymentMethod'],
        where: { tenantId, ...(yearId && { allocations: { some: { invoice: { academicYearId: yearId } } } }) },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.feePayment.findMany({
        where: { tenantId, paidAt: { gte: trendStart } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.feeRefund.findMany({
        where: { payment: { tenantId }, processedAt: { gte: trendStart } },
        select: { amount: true, processedAt: true },
      }),
    ]);

    const invoiced = toPaise(totals._sum.totalAmount);
    const collected = toPaise(totals._sum.paidAmount);
    const outstanding = toPaise(totals._sum.balanceAmount);

    const trend = new Map(trendMonths.map((m) => [m.month, 0]));
    let todayCollection = 0;
    let monthCollection = 0;
    const add = (instant: Date, paise: number) => {
      const key = zonedMonthKey(instant, timezone);
      if (trend.has(key)) trend.set(key, trend.get(key)! + paise);
      if (instant >= dayStart) todayCollection += paise;
      if (instant >= monthStart) monthCollection += paise;
    };
    payments.forEach((p) => add(p.paidAt, toPaise(p.amount)));
    refunds.forEach((r) => add(r.processedAt, -toPaise(r.amount)));

    return {
      currency,
      academicYearId: yearId,
      invoiced: paiseToNumber(invoiced),
      collected: paiseToNumber(collected),
      outstanding: paiseToNumber(outstanding),
      overdueAmount: paiseToNumber(toPaise(overdue._sum.balanceAmount)),
      overdueCount: overdue._count._all,
      collectionRate: invoiced > 0 ? Math.round((collected / invoiced) * 1000) / 10 : 0,
      todayCollection: paiseToNumber(todayCollection),
      monthCollection: paiseToNumber(monthCollection),
      byMethod: byMethod
        .map((m) => ({ method: m.paymentMethod, amount: paiseToNumber(toPaise(m._sum.amount)), count: m._count._all }))
        .sort((a, b) => b.amount - a.amount),
      monthlyTrend: trendMonths.map((m) => ({ month: m.month, label: m.label, collected: paiseToNumber(trend.get(m.month) ?? 0) })),
    };
  }

  // Students with overdue balances, biggest first.
  async defaulters(tenantId: string, query: DefaultersQueryDto) {
    const { today } = await this.context.settings(tenantId);
    const invoices = await this.prisma.studentInvoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: InvoiceStatus.VOID },
        balanceAmount: { gt: 0 },
        dueDate: { lt: today },
        student: {
          deletedAt: null,
          ...((query.sectionId || query.classId) && {
            enrollments: {
              some: {
                academicYear: { isCurrent: true },
                ...(query.sectionId ? { sectionId: query.sectionId } : { section: { classId: query.classId } }),
              },
            },
          }),
        },
      },
      select: { studentId: true, balanceAmount: true, dueDate: true },
    });

    const byStudent = new Map<string, { overdue: number; oldest: Date; count: number }>();
    for (const inv of invoices) {
      const entry = byStudent.get(inv.studentId) ?? { overdue: 0, oldest: inv.dueDate, count: 0 };
      entry.overdue += toPaise(inv.balanceAmount);
      entry.count += 1;
      if (inv.dueDate < entry.oldest) entry.oldest = inv.dueDate;
      byStudent.set(inv.studentId, entry);
    }
    const studentIds = [...byStudent.keys()];
    if (!studentIds.length) return [];

    const [students, labels] = await Promise.all([
      this.prisma.student.findMany({
        where: { tenantId, id: { in: studentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          phone: true,
          guardians: {
            orderBy: { isPrimary: 'desc' },
            select: {
              relationship: true,
              parent: { select: { deletedAt: true, user: { select: { firstName: true, lastName: true, phone: true } } } },
            },
          },
        },
      }),
      this.context.sectionLabels(tenantId, studentIds),
    ]);

    return students
      .map((s) => {
        const entry = byStudent.get(s.id)!;
        const guardian = s.guardians.find((g) => !g.parent.deletedAt);
        return {
          studentId: s.id,
          name: studentName(s),
          admissionNumber: s.admissionNumber,
          sectionLabel: labels.get(s.id) ?? null,
          overdueAmount: paiseToNumber(entry.overdue),
          overdueInvoices: entry.count,
          oldestDueDate: entry.oldest,
          daysOverdue: Math.round((today.getTime() - entry.oldest.getTime()) / DAY_MS),
          guardianName: guardian ? studentName(guardian.parent.user) : null,
          guardianRelationship: guardian?.relationship ?? null,
          guardianPhone: guardian?.parent.user.phone ?? s.phone ?? null,
        };
      })
      .sort((a, b) => b.overdueAmount - a.overdueAmount);
  }

  // Full fee history of one student.
  async ledger(tenantId: string, studentId: string) {
    const student = await this.context.studentSummary(tenantId, studentId);
    const { today, currency } = await this.context.settings(tenantId);

    const invoices = await this.prisma.studentInvoice.findMany({
      where: { tenantId, studentId, deletedAt: null },
      include: { items: true, academicYear: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: 'asc' }, { invoiceNumber: 'asc' }],
    });
    const payments = await this.prisma.feePayment.findMany({
      where: { tenantId, allocations: { some: { invoice: { studentId, tenantId } } } },
      include: {
        allocations: {
          orderBy: [{ allocatedAt: 'asc' }, { id: 'asc' }],
          select: { invoiceId: true, allocatedAmount: true, invoice: { select: { invoiceNumber: true } } },
        },
        refunds: { orderBy: { processedAt: 'asc' } },
      },
      orderBy: { paidAt: 'desc' },
    });

    let invoiced = 0;
    let paid = 0;
    let balance = 0;
    for (const inv of invoices) {
      if (inv.status === InvoiceStatus.VOID) continue;
      invoiced += toPaise(inv.totalAmount);
      paid += toPaise(inv.paidAmount);
      balance += toPaise(inv.balanceAmount);
    }

    return {
      currency,
      student,
      invoices: invoices.map((inv) => ({
        ...inv,
        isOverdue: inv.status !== InvoiceStatus.VOID && toPaise(inv.balanceAmount) > 0 && inv.dueDate < today,
      })),
      payments: payments.map(({ allocations, refunds, ...p }) => ({
        ...p,
        allocations: allocations.map((a) => ({
          invoiceId: a.invoiceId,
          invoiceNumber: a.invoice.invoiceNumber,
          allocatedAmount: a.allocatedAmount,
        })),
        refunds,
        refundedAmount: fromPaise(refunds.reduce((sum, r) => sum + toPaise(r.amount), 0)).toFixed(2),
      })),
      totals: { invoiced: paiseToNumber(invoiced), paid: paiseToNumber(paid), balance: paiseToNumber(balance) },
    };
  }
}
