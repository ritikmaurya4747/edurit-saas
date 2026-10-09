import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StaffContextService } from '../../common/services/staff-context.service';
import { formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import type { AuthUser } from '../../common/types/auth-user';
import { AcademicYearsService } from '../academic/academic-years.service';
import { ClassesService } from '../academic/classes.service';
import {
  byRollThenName,
  firstOfMonth,
  percent,
  personName,
  resolveRange,
  SECTION_SELECT,
  sectionLabel,
} from './attendance.helpers';
import {
  DateRangeQueryDto,
  MarkAttendanceDto,
  ReportQueryDto,
  RosterQueryDto,
  SummaryQueryDto,
  TrendQueryDto,
} from './dto/attendance.dto';

type Counts = { present: number; absent: number; late: number; excused: number };

const emptyCounts = (): Counts => ({ present: 0, absent: 0, late: 0, excused: 0 });

const STATUS_KEY: Record<AttendanceStatus, keyof Counts> = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

const total = (c: Counts) => c.present + c.absent + c.late + c.excused;
// Late students were in school, so they count as attended.
const attendedPercent = (c: Counts) => percent(c.present + c.late, total(c));

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staffContext: StaffContextService,
    private readonly years: AcademicYearsService,
    private readonly classes: ClassesService,
  ) {}

  // ---------------------------------------------------------------------------
  // Roster for marking
  // ---------------------------------------------------------------------------
  async roster(tenantId: string, query: RosterQueryDto) {
    const section = await this.requireSection(tenantId, query.sectionId);
    const year = await this.years.requireCurrent(tenantId);
    const date = query.date ? parseDateOnly(query.date) : await this.today(tenantId);
    const periodNumber = query.periodNumber ?? 0;

    const [enrollments, session] = await Promise.all([
      this.sectionEnrollments(tenantId, year.id, section.id),
      this.prisma.attendanceSession.findUnique({
        where: {
          tenantId_sectionId_attendanceDate_periodNumber: {
            tenantId,
            sectionId: section.id,
            attendanceDate: date,
            periodNumber,
          },
        },
        include: {
          records: { select: { studentId: true, status: true, remarks: true, markedAt: true } },
          staff: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
    ]);

    const studentIds = enrollments.map((e) => e.student.id);
    const leaves = studentIds.length
      ? await this.prisma.studentLeave.findMany({
          where: {
            tenantId,
            status: 'APPROVED',
            studentId: { in: studentIds },
            startDate: { lte: date },
            endDate: { gte: date },
          },
          select: { studentId: true },
        })
      : [];
    const onLeave = new Set(leaves.map((l) => l.studentId));
    const records = new Map((session?.records ?? []).map((r) => [r.studentId, r]));

    const students = enrollments
      .map((e) => {
        const record = records.get(e.student.id);
        const guardianPhone =
          e.student.guardians.map((g) => g.parent.user.phone).find((p) => !!p) ?? e.student.phone ?? null;
        return {
          studentId: e.student.id,
          name: personName(e.student),
          rollNumber: e.rollNumber,
          admissionNumber: e.student.admissionNumber,
          status: record?.status ?? null,
          remarks: record?.remarks ?? null,
          onLeave: onLeave.has(e.student.id),
          guardianPhone,
        };
      })
      .sort(byRollThenName);

    const markedAt = session
      ? session.records.reduce<Date>((latest, r) => (r.markedAt > latest ? r.markedAt : latest), session.createdAt)
      : null;

    return {
      date: formatDateOnly(date),
      periodNumber,
      section: { id: section.id, label: sectionLabel(section) },
      session: session ? { id: session.id, markedAt, takenBy: personName(session.staff.user) } : null,
      students,
    };
  }

  // ---------------------------------------------------------------------------
  // Mark / update attendance
  // ---------------------------------------------------------------------------
  async mark(user: AuthUser, dto: MarkAttendanceDto) {
    const tenantId = user.tenantId;
    const section = await this.requireSection(tenantId, dto.sectionId);
    const year = await this.years.requireCurrent(tenantId);
    const date = parseDateOnly(dto.date);
    const periodNumber = dto.periodNumber ?? 0;

    if (date > (await this.today(tenantId))) {
      throw new BadRequestException('Attendance cannot be marked for a future date');
    }
    if (!dto.records?.length) throw new BadRequestException('Mark at least one student');

    const ids = dto.records.map((r) => r.studentId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('A student appears more than once in the list');

    const enrolled = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId,
        academicYearId: year.id,
        sectionId: section.id,
        studentId: { in: ids },
        student: { deletedAt: null, status: 'ACTIVE' },
      },
      select: { studentId: true },
    });
    if (enrolled.length !== ids.length) {
      const known = new Set(enrolled.map((e) => e.studentId));
      const missing = ids.filter((id) => !known.has(id)).length;
      throw new BadRequestException(`${missing} student(s) in the list are not active students of ${sectionLabel(section)}`);
    }

    const staffId = await this.staffContext.resolveStaffId(user);
    const now = new Date();

    const session = await this.prisma.$transaction(
      async (tx) => {
        const s = await tx.attendanceSession.upsert({
          where: {
            tenantId_sectionId_attendanceDate_periodNumber: {
              tenantId,
              sectionId: section.id,
              attendanceDate: date,
              periodNumber,
            },
          },
          create: { tenantId, sectionId: section.id, staffId, attendanceDate: date, periodNumber },
          update: { staffId },
        });
        for (const record of dto.records) {
          const remarks = record.remarks?.trim() || null;
          await tx.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: s.id, studentId: record.studentId } },
            create: { sessionId: s.id, studentId: record.studentId, status: record.status, remarks, markedAt: now },
            update: { status: record.status, remarks, markedAt: now },
          });
        }
        return s;
      },
      { timeout: 20_000 },
    );

    const counts = emptyCounts();
    dto.records.forEach((r) => (counts[STATUS_KEY[r.status]] += 1));

    await this.audit.log(user, 'MARK', 'AttendanceSession', session.id, {
      section: sectionLabel(section),
      date: formatDateOnly(date),
      periodNumber,
      ...counts,
    });

    return {
      sessionId: session.id,
      date: formatDateOnly(date),
      section: { id: section.id, label: sectionLabel(section) },
      total: dto.records.length,
      ...counts,
      percent: attendedPercent(counts),
    };
  }

  // ---------------------------------------------------------------------------
  // Daily summary across all sections (full-day sessions only)
  // ---------------------------------------------------------------------------
  async summary(tenantId: string, query: SummaryQueryDto) {
    const date = query.date ? parseDateOnly(query.date) : await this.today(tenantId);

    const [sections, sessions, grouped] = await Promise.all([
      this.classes.listSections(tenantId),
      this.prisma.attendanceSession.findMany({
        where: { tenantId, attendanceDate: date, periodNumber: 0 },
        select: { id: true, sectionId: true },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['sessionId', 'status'],
        where: { session: { tenantId, attendanceDate: date, periodNumber: 0 } },
        _count: { _all: true },
      }),
    ]);

    const sessionSection = new Map(sessions.map((s) => [s.id, s.sectionId]));
    const bySection = new Map<string, Counts>();
    grouped.forEach((g) => {
      const sectionId = sessionSection.get(g.sessionId);
      if (!sectionId) return;
      const counts = bySection.get(sectionId) ?? emptyCounts();
      counts[STATUS_KEY[g.status]] += g._count._all;
      bySection.set(sectionId, counts);
    });
    const markedSections = new Set(sessions.map((s) => s.sectionId));

    const totals = emptyCounts();
    let totalStudents = 0;
    const rows = sections.map((s) => {
      const counts = bySection.get(s.id) ?? emptyCounts();
      totals.present += counts.present;
      totals.absent += counts.absent;
      totals.late += counts.late;
      totals.excused += counts.excused;
      totalStudents += s.studentCount;
      return {
        sectionId: s.id,
        label: s.label,
        totalStudents: s.studentCount,
        marked: markedSections.has(s.id),
        ...counts,
        percent: attendedPercent(counts),
      };
    });

    return {
      date: formatDateOnly(date),
      totals: {
        ...totals,
        marked: total(totals),
        totalStudents,
        percent: attendedPercent(totals),
        sectionsMarked: rows.filter((r) => r.marked).length,
        sectionsTotal: sections.length,
      },
      sections: rows,
    };
  }

  // ---------------------------------------------------------------------------
  // Monthly trend (oldest → newest)
  // ---------------------------------------------------------------------------
  async trend(tenantId: string, query: TrendQueryDto) {
    const months = query.months ?? 6;
    const today = await this.today(tenantId);
    const start = firstOfMonth(today);
    start.setUTCMonth(start.getUTCMonth() - (months - 1));

    const rows = await this.prisma.$queryRaw<{ month: string; attended: number; total: number }[]>(Prisma.sql`
      SELECT to_char(s.attendance_date, 'YYYY-MM') AS month,
             COUNT(*) FILTER (WHERE r.status IN ('PRESENT', 'LATE'))::int AS attended,
             COUNT(*)::int AS total
      FROM attendance_records r
      JOIN attendance_sessions s ON s.id = r.session_id
      WHERE s.tenant_id = ${tenantId}::uuid
        AND s.period_number = 0
        AND s.attendance_date >= ${formatDateOnly(start)}::date
        AND s.attendance_date <= ${formatDateOnly(today)}::date
      GROUP BY 1
    `);
    const byMonth = new Map(rows.map((r) => [r.month, r]));

    const result: { month: string; label: string; percent: number | null }[] = [];
    for (let i = 0; i < months; i += 1) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = formatDateOnly(d).slice(0, 7);
      const row = byMonth.get(key);
      result.push({
        month: key,
        label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        percent: row ? percent(Number(row.attended), Number(row.total)) : null,
      });
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Section register: per-student totals over a date range
  // ---------------------------------------------------------------------------
  async report(tenantId: string, query: ReportQueryDto) {
    const section = await this.requireSection(tenantId, query.sectionId);
    const year = await this.years.requireCurrent(tenantId);
    const range = resolveRange(await this.today(tenantId), query.from, query.to);

    const [enrollments, sessions] = await Promise.all([
      this.sectionEnrollments(tenantId, year.id, section.id),
      this.prisma.attendanceSession.findMany({
        where: {
          tenantId,
          sectionId: section.id,
          periodNumber: 0,
          attendanceDate: { gte: range.from, lte: range.to },
        },
        select: { attendanceDate: true, records: { select: { studentId: true, status: true } } },
      }),
    ]);

    const perStudent = new Map<string, Counts>();
    sessions.forEach((s) =>
      s.records.forEach((r) => {
        const counts = perStudent.get(r.studentId) ?? emptyCounts();
        counts[STATUS_KEY[r.status]] += 1;
        perStudent.set(r.studentId, counts);
      }),
    );
    const workingDays = new Set(sessions.map((s) => formatDateOnly(s.attendanceDate))).size;

    const students = enrollments
      .map((e) => {
        const counts = perStudent.get(e.student.id) ?? emptyCounts();
        return {
          studentId: e.student.id,
          name: personName(e.student),
          rollNumber: e.rollNumber,
          admissionNumber: e.student.admissionNumber,
          ...counts,
          marked: total(counts),
          percent: attendedPercent(counts),
        };
      })
      .sort(byRollThenName);

    return {
      from: range.fromStr,
      to: range.toStr,
      section: { id: section.id, label: sectionLabel(section) },
      workingDays,
      students,
    };
  }

  // ---------------------------------------------------------------------------
  // One student's attendance history
  // ---------------------------------------------------------------------------
  async studentHistory(tenantId: string, studentId: string, query: DateRangeQueryDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        enrollments: {
          where: { academicYear: { isCurrent: true, deletedAt: null } },
          select: { rollNumber: true, section: { select: SECTION_SELECT } },
          take: 1,
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const today = await this.today(tenantId);
    const currentYear = await this.years.current(tenantId);
    const defaultFrom = currentYear && currentYear.startDate <= today ? currentYear.startDate : undefined;
    const range = resolveRange(today, query.from, query.to, defaultFrom);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: { tenantId, periodNumber: 0, attendanceDate: { gte: range.from, lte: range.to } },
      },
      select: { status: true, remarks: true, session: { select: { attendanceDate: true } } },
      orderBy: { session: { attendanceDate: 'desc' } },
    });

    const counts = emptyCounts();
    records.forEach((r) => (counts[STATUS_KEY[r.status]] += 1));
    const enrollment = student.enrollments[0];

    return {
      student: {
        id: student.id,
        name: personName(student),
        admissionNumber: student.admissionNumber,
        rollNumber: enrollment?.rollNumber ?? null,
        sectionLabel: enrollment ? sectionLabel(enrollment.section) : null,
      },
      from: range.fromStr,
      to: range.toStr,
      summary: { ...counts, total: total(counts), percent: attendedPercent(counts) },
      records: records.map((r) => ({
        date: formatDateOnly(r.session.attendanceDate),
        status: r.status,
        remarks: r.remarks,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  private async requireSection(tenantId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId, deletedAt: null, class: { deletedAt: null } },
      select: SECTION_SELECT,
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  // Active students of a section in the given academic year.
  private sectionEnrollments(tenantId: string, academicYearId: string, sectionId: string) {
    return this.prisma.studentEnrollment.findMany({
      where: { tenantId, academicYearId, sectionId, student: { deletedAt: null, status: 'ACTIVE' } },
      select: {
        rollNumber: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            phone: true,
            guardians: {
              where: { parent: { deletedAt: null } },
              orderBy: { isPrimary: 'desc' },
              select: { parent: { select: { user: { select: { phone: true } } } } },
            },
          },
        },
      },
    });
  }

  private async today(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return todayDateOnly(settings?.timezone || 'Asia/Kolkata');
  }
}
