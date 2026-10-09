import { Injectable } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { formatDateOnly, todayDateOnly } from '../../common/utils/date';
import { round2, toNumber } from '../../common/utils/money';
import { zonedDayRange } from './utils/zoned-time';

// Notice audiences visible to each role (in addition to ALL). Mirrors the
// communication module so the dashboard shows what the user can open.
const ROLE_AUDIENCES: Record<string, string[]> = {
  ADMIN: ['STAFF'],
  TEACHER: ['STAFF', 'TEACHER'],
  ACCOUNTANT: ['STAFF'],
  STAFF: ['STAFF'],
  STUDENT: ['STUDENT'],
  PARENT: ['PARENT'],
};

const PENDING_ADMISSION_STAGES = ['ENQUIRY', 'DOCUMENT_VERIFICATION', 'ENTRANCE_TEST'] as const;

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(user: AuthUser) {
    const tenantId = user.tenantId;

    const [tenant, academicYear] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, settings: { select: { timezone: true, currency: true } } },
      }),
      this.prisma.academicYear.findFirst({
        where: { tenantId, deletedAt: null, isCurrent: true },
        select: { id: true, name: true },
      }),
    ]);

    const timezone = tenant?.settings?.timezone || 'Asia/Kolkata';
    const currency = tenant?.settings?.currency || 'INR';
    const today = todayDateOnly(timezone);
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const trendStart = new Date(Date.UTC(year, month - 5, 1));
    const todayRange = zonedDayRange(today, timezone);

    const canSeeFees = user.isAdmin || user.permissions.includes(PERMISSIONS.INVOICE_READ);
    const canSeeAllNotices = user.isAdmin || user.permissions.includes(PERMISSIONS.NOTICE_PUBLISH);
    const audiences = new Set<string>(['ALL']);
    user.roles.forEach((r) => (ROLE_AUDIENCES[r] ?? []).forEach((a) => audiences.add(a)));

    const todaySessionWhere: Prisma.AttendanceSessionWhereInput = { tenantId, attendanceDate: today, periodNumber: 0 };

    const [
      setupCounts,
      studentsActive,
      studentsNew,
      staffActive,
      staffOnLeave,
      attendanceToday,
      fees,
      pendingApprovals,
      attendanceTrend,
      recentNotices,
      upcomingExams,
      recentPayments,
      birthdaysToday,
    ] = await Promise.all([
      // Onboarding checklist
      Promise.all([
        this.prisma.class.count({ where: { tenantId, deletedAt: null } }),
        this.prisma.section.count({ where: { tenantId, deletedAt: null, class: { deletedAt: null } } }),
        this.prisma.subject.count({ where: { tenantId, deletedAt: null } }),
      ]),
      this.prisma.student.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.student.count({
        where: { tenantId, deletedAt: null, status: 'ACTIVE', admissionDate: { gte: monthStart, lte: today } },
      }),
      this.prisma.staff.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.staffLeave
        .groupBy({
          by: ['staffId'],
          where: {
            tenantId,
            status: 'APPROVED',
            startDate: { lte: today },
            endDate: { gte: today },
            staff: { deletedAt: null },
          },
        })
        .then((rows) => rows.length),
      this.attendanceToday(tenantId, academicYear?.id ?? null, todaySessionWhere),
      canSeeFees ? this.fees(tenantId, academicYear?.id ?? null, currency, today, todayRange) : Promise.resolve(null),
      Promise.all([
        this.prisma.studentLeave.count({ where: { tenantId, status: 'PENDING', student: { deletedAt: null } } }),
        this.prisma.staffLeave.count({ where: { tenantId, status: 'PENDING', staff: { deletedAt: null } } }),
        this.prisma.admissionEnquiry.count({ where: { tenantId, stage: { in: [...PENDING_ADMISSION_STAGES] } } }),
      ]).then(([studentLeaves, staffLeaves, admissions]) => ({
        studentLeaves,
        staffLeaves,
        admissions,
        total: studentLeaves + staffLeaves + admissions,
      })),
      this.attendanceTrend(tenantId, trendStart, today),
      this.prisma.notice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          ...(!canSeeAllNotices && { targetRole: { in: [...audiences] } }),
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, priority: true, targetRole: true, publishedAt: true },
      }),
      this.prisma.exam.findMany({
        where: { tenantId, deletedAt: null, endDate: { gte: today } },
        orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
        take: 3,
        select: { id: true, name: true, startDate: true, endDate: true, isPublished: true },
      }),
      canSeeFees ? this.recentPayments(tenantId) : Promise.resolve(null),
      this.birthdays(tenantId, academicYear?.id ?? null, today),
    ]);

    const [classes, sections, subjects] = setupCounts;

    return {
      greetingName: user.firstName,
      schoolName: tenant?.name ?? '',
      today: formatDateOnly(today),
      academicYear,
      setup: {
        hasAcademicYear: !!academicYear,
        classes,
        sections,
        subjects,
        staff: staffActive,
        students: studentsActive,
      },
      students: { active: studentsActive, newThisMonth: studentsNew },
      staff: { active: staffActive, onLeaveToday: staffOnLeave },
      attendanceToday,
      fees,
      pendingApprovals,
      attendanceTrend,
      recentNotices,
      upcomingExams,
      recentPayments,
      birthdaysToday,
    };
  }

  // Daily (period 0) attendance for today across the school.
  private async attendanceToday(
    tenantId: string,
    academicYearId: string | null,
    sessionWhere: Prisma.AttendanceSessionWhereInput,
  ) {
    const [byStatus, sectionsMarked, sectionsTotal, totalStudents] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { session: sessionWhere },
        _count: { _all: true },
      }),
      this.prisma.attendanceSession.count({ where: sessionWhere }),
      this.prisma.section.count({ where: { tenantId, deletedAt: null, class: { deletedAt: null } } }),
      academicYearId
        ? this.prisma.studentEnrollment.count({
            where: { tenantId, academicYearId, student: { deletedAt: null, status: 'ACTIVE' } },
          })
        : this.prisma.student.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
    ]);

    const count = (status: string) => byStatus.find((r) => r.status === status)?._count._all ?? 0;
    const present = count('PRESENT') + count('LATE');
    const absent = count('ABSENT');
    const marked = byStatus.reduce((sum, r) => sum + r._count._all, 0);

    return {
      percent: percent(present, marked),
      present,
      absent,
      marked,
      totalStudents,
      sectionsMarked,
      sectionsTotal,
    };
  }

  // Fee position for the current academic year (overdue counts every year).
  private async fees(
    tenantId: string,
    academicYearId: string | null,
    currency: string,
    today: Date,
    todayRange: { gte: Date; lt: Date },
  ) {
    const baseWhere: Prisma.StudentInvoiceWhereInput = { tenantId, deletedAt: null, status: { not: 'VOID' } };

    const [totals, overdue, paymentsToday, refundsToday] = await Promise.all([
      this.prisma.studentInvoice.aggregate({
        where: { ...baseWhere, ...(academicYearId && { academicYearId }) },
        _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
      }),
      this.prisma.studentInvoice.aggregate({
        where: {
          ...baseWhere,
          status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
          dueDate: { lt: today },
        },
        _count: { _all: true },
        _sum: { balanceAmount: true },
      }),
      this.prisma.feePayment.aggregate({
        where: { tenantId, paidAt: todayRange },
        _sum: { amount: true },
      }),
      this.prisma.feeRefund.aggregate({
        where: { payment: { tenantId }, status: 'COMPLETED', processedAt: todayRange },
        _sum: { amount: true },
      }),
    ]);

    const invoiced = round2(toNumber(totals._sum.totalAmount));
    const collected = round2(toNumber(totals._sum.paidAmount));
    return {
      currency,
      invoiced,
      collected,
      outstanding: round2(toNumber(totals._sum.balanceAmount)),
      collectionRate: percent(collected, invoiced),
      overdueCount: overdue._count._all,
      overdueAmount: round2(toNumber(overdue._sum.balanceAmount)),
      todayCollection: round2(toNumber(paymentsToday._sum.amount)),
      todayRefunds: round2(toNumber(refundsToday._sum.amount)),
    };
  }

  // Monthly daily-attendance % for the last 6 months, one grouped query.
  private async attendanceTrend(tenantId: string, start: Date, today: Date) {
    const rows = await this.prisma.$queryRaw<{ month: string; present: number; total: number }[]>`
      SELECT to_char(s.attendance_date, 'YYYY-MM') AS month,
             (COUNT(*) FILTER (WHERE r.status IN ('PRESENT', 'LATE')))::int AS present,
             COUNT(*)::int AS total
        FROM attendance_records r
        JOIN attendance_sessions s ON s.id = r.session_id
       WHERE s.tenant_id = ${tenantId}::uuid
         AND s.period_number = 0
         AND s.attendance_date >= ${formatDateOnly(start)}::date
         AND s.attendance_date <= ${formatDateOnly(today)}::date
       GROUP BY 1
       ORDER BY 1`;

    const byMonth = new Map(rows.map((r) => [r.month, r]));
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = formatDateOnly(d).slice(0, 7);
      const row = byMonth.get(key);
      return {
        month: key,
        label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        percent: row ? percent(Number(row.present), Number(row.total)) : null,
      };
    });
  }

  private async recentPayments(tenantId: string) {
    const payments = await this.prisma.feePayment.findMany({
      where: { tenantId },
      orderBy: { paidAt: 'desc' },
      take: 5,
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        paymentMethod: true,
        paidAt: true,
        allocations: {
          take: 1,
          orderBy: { allocatedAt: 'asc' },
          select: { invoice: { select: { student: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
    return payments.map((p) => {
      const student = p.allocations[0]?.invoice.student;
      return {
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: round2(toNumber(p.amount)),
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
        studentName: student ? `${student.firstName} ${student.lastName}`.trim() : null,
      };
    });
  }

  // Active students born on today's month/day (max 10).
  private async birthdays(tenantId: string, academicYearId: string | null, today: Date) {
    const month = today.getUTCMonth() + 1;
    const day = today.getUTCDate();
    const students = await this.prisma.$queryRaw<{ id: string; first_name: string; last_name: string }[]>`
      SELECT id, first_name, last_name
        FROM students
       WHERE tenant_id = ${tenantId}::uuid
         AND status = 'ACTIVE'
         AND deleted_at IS NULL
         AND EXTRACT(MONTH FROM dob)::int = ${month}::int
         AND EXTRACT(DAY FROM dob)::int = ${day}::int
       ORDER BY first_name, last_name
       LIMIT 10`;
    if (!students.length) return [];

    const enrollments = academicYearId
      ? await this.prisma.studentEnrollment.findMany({
          where: { tenantId, academicYearId, studentId: { in: students.map((s) => s.id) } },
          select: { studentId: true, section: { select: { name: true, class: { select: { name: true } } } } },
        })
      : [];
    const labels = new Map(enrollments.map((e) => [e.studentId, `${e.section.class.name} - ${e.section.name}`]));

    return students.map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
      sectionLabel: labels.get(s.id) ?? null,
    }));
  }
}
