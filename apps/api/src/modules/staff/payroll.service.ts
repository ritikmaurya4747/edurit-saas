import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { decimal, round2, toNumber } from '../../common/utils/money';
import { MonthQueryDto, PayrollPeriodDto, UpdatePayrollDto } from './dto/staff.dto';
import { StaffAttendanceService } from './staff-attendance.service';
import { EMPLOYED_STATUSES, daysInMonth, monthRange, staffName } from './staff-hr.utils';

const payrollInclude = {
  staff: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      department: true,
      joiningDate: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.PayrollRecordInclude;

type PayrollRow = Prisma.PayrollRecordGetPayload<{ include: typeof payrollInclude }>;

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly attendance: StaffAttendanceService,
  ) {}

  async list(tenantId: string, query: MonthQueryDto) {
    const { month, year } = await this.attendance.resolveMonth(tenantId, query);
    const rows = await this.prisma.payrollRecord.findMany({
      where: { tenantId, month, year },
      include: payrollInclude,
      orderBy: [{ staff: { user: { firstName: 'asc' } } }, { staff: { user: { lastName: 'asc' } } }],
    });

    const totals = { gross: 0, deductions: 0, net: 0, disbursed: 0, pending: 0, count: rows.length, disbursedCount: 0 };
    for (const r of rows) {
      const net = toNumber(r.netSalary);
      totals.gross += toNumber(r.basicSalary) + toNumber(r.allowances);
      totals.deductions += toNumber(r.deductions);
      totals.net += net;
      if (r.isDisbursed) {
        totals.disbursed += net;
        totals.disbursedCount++;
      } else totals.pending += net;
    }
    (['gross', 'deductions', 'net', 'disbursed', 'pending'] as const).forEach((k) => (totals[k] = round2(totals[k])));

    return { month, year, records: rows.map((r) => this.toItem(r)), totals };
  }

  async generate(user: AuthUser, dto: PayrollPeriodDto) {
    const { month, year } = dto;
    const { end } = monthRange(month, year);
    const staff = await this.prisma.staff.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        status: { in: EMPLOYED_STATUSES },
        OR: [{ joiningDate: null }, { joiningDate: { lte: end } }],
      },
      select: { id: true, basicSalary: true, payrollRecords: { where: { month, year }, select: { id: true } } },
    });
    const pending = staff.filter((s) => s.payrollRecords.length === 0);
    const skipped = staff.length - pending.length;
    if (!pending.length) return { month, year, created: 0, skipped };

    const summaries = await this.attendance.monthlySummary(
      user.tenantId,
      month,
      year,
      pending.map((s) => s.id),
    );
    const monthDays = daysInMonth(month, year);
    const data = pending.map((s) => {
      const basic = toNumber(s.basicSalary);
      const lopDays = summaries.get(s.id)?.lopDays ?? 0;
      const deductions = Math.min(basic, round2((lopDays * basic) / monthDays));
      return {
        tenantId: user.tenantId,
        staffId: s.id,
        month,
        year,
        basicSalary: decimal(basic),
        allowances: decimal(0),
        deductions: decimal(deductions),
        netSalary: decimal(round2(basic - deductions)),
      };
    });

    const result = await this.prisma.payrollRecord.createMany({ data, skipDuplicates: true });
    await this.audit.log(user, 'GENERATE', 'PayrollRecord', null, { month, year, created: result.count });
    return { month, year, created: result.count, skipped: skipped + (data.length - result.count) };
  }

  async update(user: AuthUser, id: string, dto: UpdatePayrollDto) {
    const record = await this.findOrThrow(user.tenantId, id);
    if (record.isDisbursed) throw new BadRequestException('Salary has already been disbursed and can no longer be edited');

    const basic = dto.basicSalary ?? toNumber(record.basicSalary);
    const allowances = dto.allowances ?? toNumber(record.allowances);
    const deductions = dto.deductions ?? toNumber(record.deductions);
    const net = round2(basic + allowances - deductions);
    if (net < 0) throw new BadRequestException('Deductions cannot exceed basic salary plus allowances');

    const updated = await this.prisma.payrollRecord.update({
      where: { id },
      data: { basicSalary: decimal(basic), allowances: decimal(allowances), deductions: decimal(deductions), netSalary: decimal(net) },
      include: payrollInclude,
    });
    await this.audit.log(user, 'UPDATE', 'PayrollRecord', id, { ...dto, netSalary: net });
    return this.toItem(updated);
  }

  async disburse(user: AuthUser, id: string) {
    const record = await this.findOrThrow(user.tenantId, id);
    if (record.isDisbursed) throw new BadRequestException('Salary has already been disbursed');
    const updated = await this.prisma.payrollRecord.update({
      where: { id },
      data: { isDisbursed: true, disbursedAt: new Date() },
      include: payrollInclude,
    });
    await this.audit.log(user, 'DISBURSE', 'PayrollRecord', id, { netSalary: toNumber(record.netSalary) });
    return this.toItem(updated);
  }

  async disburseAll(user: AuthUser, dto: PayrollPeriodDto) {
    const result = await this.prisma.payrollRecord.updateMany({
      where: { tenantId: user.tenantId, month: dto.month, year: dto.year, isDisbursed: false },
      data: { isDisbursed: true, disbursedAt: new Date() },
    });
    if (!result.count) throw new BadRequestException('There are no pending salaries for this month');
    await this.audit.log(user, 'DISBURSE_ALL', 'PayrollRecord', null, { month: dto.month, year: dto.year, count: result.count });
    return { month: dto.month, year: dto.year, disbursed: result.count };
  }

  async remove(user: AuthUser, id: string) {
    const record = await this.findOrThrow(user.tenantId, id);
    if (record.isDisbursed) throw new BadRequestException('A disbursed salary record cannot be deleted');
    await this.prisma.payrollRecord.delete({ where: { id } });
    await this.audit.log(user, 'DELETE', 'PayrollRecord', id, { staffId: record.staffId, month: record.month, year: record.year });
    return { id, deleted: true };
  }

  async payslip(tenantId: string, id: string) {
    const record = await this.findOrThrow(tenantId, id);
    const [tenant, summaries] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, legalName: true, settings: { select: { logoUrl: true, currency: true } } },
      }),
      this.attendance.monthlySummary(tenantId, record.month, record.year, [record.staffId]),
    ]);
    const full = await this.prisma.staff.findUnique({
      where: { id: record.staffId },
      select: { department: true, branch: { select: { name: true } } },
    });

    const basic = toNumber(record.basicSalary);
    const allowances = toNumber(record.allowances);
    const deductions = toNumber(record.deductions);
    const { lopDays, ...attendance } = summaries.get(record.staffId)!;
    const periodLabel = new Date(Date.UTC(record.year, record.month - 1, 1)).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    return {
      id: record.id,
      school: {
        name: tenant?.name ?? '',
        legalName: tenant?.legalName ?? null,
        logoUrl: tenant?.settings?.logoUrl ?? null,
        currency: tenant?.settings?.currency ?? 'INR',
        branch: full?.branch?.name ?? null,
      },
      staff: {
        id: record.staff.id,
        name: staffName(record.staff.user),
        employeeCode: record.staff.employeeCode,
        designation: record.staff.designation,
        department: full?.department ?? record.staff.department,
        joiningDate: record.staff.joiningDate,
      },
      period: { month: record.month, year: record.year, label: periodLabel, daysInMonth: daysInMonth(record.month, record.year) },
      earnings: [
        { label: 'Basic salary', amount: basic },
        { label: 'Allowances', amount: allowances },
      ],
      deductions: [{ label: lopDays ? `Loss of pay / other deductions (${lopDays} LOP day${lopDays === 1 ? '' : 's'})` : 'Deductions', amount: deductions }],
      grossEarnings: round2(basic + allowances),
      totalDeductions: deductions,
      netSalary: toNumber(record.netSalary),
      attendance: { ...attendance, lossOfPayDays: lopDays },
      isDisbursed: record.isDisbursed,
      disbursedAt: record.disbursedAt,
    };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const record = await this.prisma.payrollRecord.findFirst({ where: { id, tenantId }, include: payrollInclude });
    if (!record) throw new NotFoundException('Payroll record not found');
    return record;
  }

  private toItem(r: PayrollRow) {
    return {
      id: r.id,
      staffId: r.staffId,
      staffName: staffName(r.staff.user),
      employeeCode: r.staff.employeeCode,
      designation: r.staff.designation,
      department: r.staff.department,
      month: r.month,
      year: r.year,
      basicSalary: r.basicSalary,
      allowances: r.allowances,
      deductions: r.deductions,
      netSalary: r.netSalary,
      isDisbursed: r.isDisbursed,
      disbursedAt: r.disbursedAt,
    };
  }
}
