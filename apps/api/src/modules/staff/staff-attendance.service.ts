import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, LeaveStatus } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { dayOfWeek, formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { MonthQueryDto, StaffAttendanceBulkDto, StaffCheckDto } from './dto/staff.dto';
import {
  DEFAULT_TIMEZONE,
  EMPLOYED_STATUSES,
  LATE_AFTER,
  UNPAID_LEAVE_TYPE,
  eachDate,
  monthRange,
  staffName,
  zonedParts,
} from './staff-hr.utils';

export interface MonthlyAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  excused: number;
  onLeaveDays: number;
  workingDays: number;
  // Loss-of-pay days used by payroll: ABSENT days not covered by approved paid
  // leave, plus every day covered by approved UNPAID leave.
  lopDays: number;
}

const SUNDAY = 0;

@Injectable()
export class StaffAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------- helpers
  async timezone(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return settings?.timezone || DEFAULT_TIMEZONE;
  }

  async today(tenantId: string) {
    return todayDateOnly(await this.timezone(tenantId));
  }

  // Resolves month/year query params, defaulting to the school's current month.
  async resolveMonth(tenantId: string, query: MonthQueryDto) {
    const today = await this.today(tenantId);
    return {
      month: query.month ?? today.getUTCMonth() + 1,
      year: query.year ?? today.getUTCFullYear(),
    };
  }

  // Per-staff attendance summary for a month. Working days = Mon–Sat up to today
  // (for the current month) or the whole month (past months).
  async monthlySummary(tenantId: string, month: number, year: number, staffIds: string[]) {
    const result = new Map<string, MonthlyAttendanceSummary>();
    if (!staffIds.length) return result;

    const today = await this.today(tenantId);
    const { start, end } = monthRange(month, year);
    const workingEnd = end < today ? end : today;
    const workingDates = start <= workingEnd ? eachDate(start, workingEnd).filter((d) => dayOfWeek(parseDateOnly(d)) !== SUNDAY) : [];
    const workingSet = new Set(workingDates);

    const [records, leaves] = await Promise.all([
      this.prisma.staffAttendance.findMany({
        where: { tenantId, staffId: { in: staffIds }, attendanceDate: { gte: start, lte: end } },
        select: { staffId: true, attendanceDate: true, status: true },
      }),
      this.prisma.staffLeave.findMany({
        where: { tenantId, staffId: { in: staffIds }, status: LeaveStatus.APPROVED, startDate: { lte: end }, endDate: { gte: start } },
        select: { staffId: true, startDate: true, endDate: true, leaveType: true },
      }),
    ]);

    for (const staffId of staffIds) {
      const paidLeaveDates = new Set<string>();
      const unpaidLeaveDates = new Set<string>();
      for (const leave of leaves.filter((l) => l.staffId === staffId)) {
        const target = leave.leaveType === UNPAID_LEAVE_TYPE ? unpaidLeaveDates : paidLeaveDates;
        eachDate(leave.startDate, leave.endDate, start, end).forEach((d) => target.add(d));
      }

      const summary: MonthlyAttendanceSummary = {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        onLeaveDays: 0,
        workingDays: workingDates.length,
        lopDays: 0,
      };
      const lop = new Set(unpaidLeaveDates);
      for (const record of records.filter((r) => r.staffId === staffId)) {
        const date = formatDateOnly(record.attendanceDate);
        if (record.status === AttendanceStatus.PRESENT) summary.present++;
        else if (record.status === AttendanceStatus.LATE) summary.late++;
        else if (record.status === AttendanceStatus.EXCUSED) summary.excused++;
        else if (record.status === AttendanceStatus.ABSENT) {
          summary.absent++;
          if (!paidLeaveDates.has(date)) lop.add(date);
        }
      }
      summary.onLeaveDays = [...new Set([...paidLeaveDates, ...unpaidLeaveDates])].filter((d) => workingSet.has(d)).length;
      summary.lopDays = lop.size;
      result.set(staffId, summary);
    }
    return result;
  }

  private async requireStaff(tenantId: string, staffId: string, employedOnly = true) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, tenantId, deletedAt: null },
      select: { id: true, status: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    if (employedOnly && !EMPLOYED_STATUSES.includes(staff.status)) {
      throw new BadRequestException(`${staffName(staff.user)} is no longer employed (${staff.status.toLowerCase()})`);
    }
    return staff;
  }

  private assertNotFuture(date: Date, today: Date) {
    if (date > today) throw new BadRequestException('Attendance cannot be recorded for a future date');
  }

  // ------------------------------------------------------------------ reads
  async roster(tenantId: string, dateParam?: string) {
    const today = await this.today(tenantId);
    const date = dateParam ? parseDateOnly(dateParam) : today;

    const staff = await this.prisma.staff.findMany({
      where: { tenantId, deletedAt: null, status: { in: EMPLOYED_STATUSES } },
      orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
      select: {
        id: true,
        employeeCode: true,
        designation: true,
        department: true,
        status: true,
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        attendances: {
          where: { attendanceDate: date },
          select: { id: true, status: true, checkIn: true, checkOut: true, remarks: true },
        },
        leaves: {
          where: { status: LeaveStatus.APPROVED, startDate: { lte: date }, endDate: { gte: date } },
          select: { id: true, leaveType: true },
          take: 1,
        },
      },
    });

    return {
      date: formatDateOnly(date),
      isToday: date.getTime() === today.getTime(),
      staff: staff.map((s) => ({
        staffId: s.id,
        name: staffName(s.user),
        employeeCode: s.employeeCode,
        designation: s.designation,
        department: s.department,
        avatarUrl: s.user.avatarUrl,
        record: s.attendances[0] ?? null,
        onLeave: s.leaves.length > 0,
        leaveType: s.leaves[0]?.leaveType ?? null,
      })),
    };
  }

  async report(tenantId: string, query: MonthQueryDto) {
    const { month, year } = await this.resolveMonth(tenantId, query);
    const staff = await this.prisma.staff.findMany({
      where: { tenantId, deletedAt: null, status: { in: EMPLOYED_STATUSES } },
      orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
      select: { id: true, employeeCode: true, designation: true, department: true, user: { select: { firstName: true, lastName: true } } },
    });
    const summaries = await this.monthlySummary(
      tenantId,
      month,
      year,
      staff.map((s) => s.id),
    );
    return {
      month,
      year,
      rows: staff.map((s) => {
        const { lopDays, ...summary } = summaries.get(s.id)!;
        return {
          staffId: s.id,
          name: staffName(s.user),
          employeeCode: s.employeeCode,
          designation: s.designation,
          department: s.department,
          ...summary,
          lossOfPayDays: lopDays,
        };
      }),
    };
  }

  // ----------------------------------------------------------------- writes
  async checkIn(user: AuthUser, dto: StaffCheckDto) {
    const tz = await this.timezone(user.tenantId);
    const instant = dto.time ? new Date(dto.time) : new Date();
    const local = zonedParts(instant, tz);
    const date = parseDateOnly(dto.date ?? local.date);
    this.assertNotFuture(date, todayDateOnly(tz));
    const staff = await this.requireStaff(user.tenantId, dto.staffId);

    const where = { tenantId_staffId_attendanceDate: { tenantId: user.tenantId, staffId: staff.id, attendanceDate: date } };
    const existing = await this.prisma.staffAttendance.findUnique({ where });
    if (existing?.checkIn) {
      throw new ConflictException(`${staffName(staff.user)} has already checked in on ${formatDateOnly(date)}`);
    }

    const late = local.minutes > LATE_AFTER.hour * 60 + LATE_AFTER.minute;
    const status = late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    const record = await this.prisma.staffAttendance.upsert({
      where,
      create: { tenantId: user.tenantId, staffId: staff.id, attendanceDate: date, checkIn: instant, status },
      update: { checkIn: instant, status },
    });
    await this.audit.log(user, 'CHECK_IN', 'StaffAttendance', record.id, { staffId: staff.id, date: formatDateOnly(date), status });
    return record;
  }

  async checkOut(user: AuthUser, dto: StaffCheckDto) {
    const tz = await this.timezone(user.tenantId);
    const instant = dto.time ? new Date(dto.time) : new Date();
    const date = parseDateOnly(dto.date ?? zonedParts(instant, tz).date);
    const staff = await this.requireStaff(user.tenantId, dto.staffId);

    const record = await this.prisma.staffAttendance.findUnique({
      where: { tenantId_staffId_attendanceDate: { tenantId: user.tenantId, staffId: staff.id, attendanceDate: date } },
    });
    if (!record?.checkIn) throw new BadRequestException(`${staffName(staff.user)} has not checked in on ${formatDateOnly(date)}`);
    if (record.checkOut) throw new ConflictException(`${staffName(staff.user)} has already checked out`);
    if (instant <= record.checkIn) throw new BadRequestException('Check-out time must be after the check-in time');

    const updated = await this.prisma.staffAttendance.update({ where: { id: record.id }, data: { checkOut: instant } });
    await this.audit.log(user, 'CHECK_OUT', 'StaffAttendance', record.id, { staffId: staff.id, date: formatDateOnly(date) });
    return updated;
  }

  async bulkMark(user: AuthUser, dto: StaffAttendanceBulkDto) {
    const date = parseDateOnly(dto.date);
    this.assertNotFuture(date, await this.today(user.tenantId));

    const ids = [...new Set(dto.records.map((r) => r.staffId))];
    if (ids.length !== dto.records.length) throw new BadRequestException('Each staff member can appear only once');
    const found = await this.prisma.staff.count({ where: { tenantId: user.tenantId, id: { in: ids }, deletedAt: null } });
    if (found !== ids.length) throw new BadRequestException('One or more staff members do not belong to this school');

    await this.prisma.$transaction(async (tx) => {
      for (const r of dto.records) {
        await tx.staffAttendance.upsert({
          where: { tenantId_staffId_attendanceDate: { tenantId: user.tenantId, staffId: r.staffId, attendanceDate: date } },
          create: { tenantId: user.tenantId, staffId: r.staffId, attendanceDate: date, status: r.status, remarks: r.remarks?.trim() || null },
          update: { status: r.status, ...(r.remarks !== undefined && { remarks: r.remarks.trim() || null }) },
        });
      }
      await this.audit.log(user, 'BULK_MARK', 'StaffAttendance', null, { date: dto.date, count: dto.records.length }, tx);
    });
    return { date: dto.date, saved: dto.records.length };
  }
}
