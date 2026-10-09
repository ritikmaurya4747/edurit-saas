import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type AttendanceStatus, type LeaveStatus } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { addDays, dayOfWeek, formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { round2, toNumber } from '../../common/utils/money';
import type { AuthUser } from '../../common/types/auth-user';
import { MarksService } from '../examination/marks.service';
import { autoRemark, gradeFor, percentOf } from '../examination/grading';
import { PortalAccessService, type StudentAccess } from './portal-access.service';
import type { HomeworkFilter, PortalLeaveDto } from './dto/portal.dto';

const DAY_MS = 86_400_000;
const MAX_LEAVE_DAYS = 31;
const MAX_BACKDATE_DAYS = 30;

const SECTION_SELECT = { id: true, name: true, class: { select: { name: true } } } as const;

const STUDENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  admissionNumber: true,
  photoUrl: true,
  status: true,
  enrollments: {
    where: { academicYear: { deletedAt: null } },
    select: { academicYearId: true, sectionId: true, rollNumber: true, section: { select: SECTION_SELECT } },
  },
} satisfies Prisma.StudentSelect;

type StudentRow = Prisma.StudentGetPayload<{ select: typeof STUDENT_SELECT }>;
type EnrollmentRow = StudentRow['enrollments'][number];
type YearRow = { id: string; name: string; startDate: Date; endDate: Date };

const TEACHER_SELECT = { user: { select: { firstName: true, lastName: true } } } as const;

const personName = (p?: { firstName?: string | null; lastName?: string | null } | null) =>
  p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';

const sectionLabel = (section: { name: string; class: { name: string } }) => `${section.class.name} - ${section.name}`;

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

// Money sums are done in paise to avoid floating point drift.
const paise = (value: Prisma.Decimal | number | string | null | undefined) => Math.round(toNumber(value) * 100);
const fromPaise = (value: number) => round2(value / 100);

const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY_MS);

// 'YYYY-MM' of a date-only value.
const key7 = (date: Date) => formatDateOnly(date).slice(0, 7);

const excerpt = (text: string, max = 220) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: PortalAccessService,
    private readonly marks: MarksService,
  ) {}

  // ---------------------------------------------------------------------------
  // Who am I / my children
  // ---------------------------------------------------------------------------
  async me(user: AuthUser) {
    const access = await this.access.resolveAccess(user);
    const [year, students] = await Promise.all([
      this.currentYear(user.tenantId),
      access.studentIds.length
        ? this.prisma.student.findMany({
            where: { tenantId: user.tenantId, id: { in: access.studentIds }, deletedAt: null },
            select: STUDENT_SELECT,
          })
        : Promise.resolve([] as StudentRow[]),
    ]);

    const children = students
      .map((s) => ({
        ...this.summary(s, this.enrollmentFor(s, year)),
        isSelf: s.id === access.ownStudentId,
        canApplyLeave: access.childIds.includes(s.id),
      }))
      .sort((a, b) => Number(b.isSelf) - Number(a.isSelf) || a.name.localeCompare(b.name));

    const type: 'STUDENT' | 'PARENT' = access.childIds.length
      ? 'PARENT'
      : access.ownStudentId
        ? 'STUDENT'
        : user.roles.includes('PARENT')
          ? 'PARENT'
          : 'STUDENT';

    return {
      type,
      name: personName(user),
      academicYear: year ? { id: year.id, name: year.name } : null,
      children,
    };
  }

  // ---------------------------------------------------------------------------
  // Home overview
  // ---------------------------------------------------------------------------
  async overview(user: AuthUser, studentId: string) {
    const access = await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { tenantId } = user;
    const { today, year, enrollment } = ctx;
    const audiences = this.audiences(access);
    const now = new Date();

    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const yearEnd = year && year.endDate < today ? year.endDate : today;

    const homeworkBase = enrollment && year ? this.homeworkWhere(tenantId, enrollment.sectionId, year) : null;
    const pendingWhere: Prisma.HomeworkWhereInput | null = homeworkBase
      ? { ...homeworkBase, submissions: { none: { studentId } } }
      : null;

    const [yearRecords, invoices, pendingCount, overdueHomework, dueSoon, timetable, notices, events, exams, latestResult] =
      await Promise.all([
        year ? this.attendanceRecords(tenantId, studentId, year.startDate, yearEnd) : Promise.resolve([]),
        this.prisma.studentInvoice.findMany({
          where: { tenantId, studentId, deletedAt: null, status: { not: 'VOID' }, balanceAmount: { gt: 0 } },
          select: { balanceAmount: true, dueDate: true, currency: true },
        }),
        pendingWhere ? this.prisma.homework.count({ where: pendingWhere }) : Promise.resolve(0),
        pendingWhere ? this.prisma.homework.count({ where: { ...pendingWhere, dueDate: { lt: now } } }) : Promise.resolve(0),
        pendingWhere
          ? this.prisma.homework.findMany({
              where: { ...pendingWhere, dueDate: { gte: now } },
              orderBy: { dueDate: 'asc' },
              take: 3,
              select: { id: true, title: true, dueDate: true, subject: { select: { name: true } } },
            })
          : Promise.resolve([]),
        year && enrollment
          ? this.prisma.timetable.findMany({
              where: { tenantId, academicYearId: year.id, sectionId: enrollment.sectionId, dayOfWeek: dayOfWeek(today) },
              orderBy: { periodNumber: 'asc' },
              include: { subject: { select: { name: true, code: true } }, staff: { select: TEACHER_SELECT } },
            })
          : Promise.resolve([]),
        this.prisma.notice.findMany({
          where: { tenantId, deletedAt: null, status: 'PUBLISHED', targetRole: { in: audiences }, publishedAt: { lte: now } },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { id: true, title: true, content: true, priority: true, publishedAt: true },
        }),
        this.prisma.calendarEvent.findMany({
          where: { tenantId, deletedAt: null, targetRole: { in: audiences }, endDate: { gte: today } },
          orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
          take: 3,
          select: { id: true, title: true, type: true, startDate: true, endDate: true, isHoliday: true },
        }),
        year
          ? this.prisma.exam.findMany({
              where: { tenantId, deletedAt: null, academicYearId: year.id, endDate: { gte: today } },
              orderBy: { startDate: 'asc' },
              take: 3,
              select: { id: true, name: true, startDate: true, endDate: true },
            })
          : Promise.resolve([]),
        this.latestResult(tenantId, ctx.student),
      ]);

    const yearSummary = this.summarize(yearRecords);
    const monthSummary = this.summarize(yearRecords.filter((r) => r.session.attendanceDate >= monthStart));

    let due = 0;
    let overdue = 0;
    let overdueCount = 0;
    let nextDueDate: Date | null = null;
    for (const inv of invoices) {
      const balance = paise(inv.balanceAmount);
      due += balance;
      if (inv.dueDate < today) {
        overdue += balance;
        overdueCount += 1;
      } else if (!nextDueDate || inv.dueDate < nextDueDate) {
        nextDueDate = inv.dueDate;
      }
    }

    const upcomingEvents = [
      ...events.map((e) => ({
        id: e.id,
        kind: 'EVENT' as const,
        type: e.type as string,
        title: e.title,
        startDate: formatDateOnly(e.startDate),
        endDate: formatDateOnly(e.endDate),
        isHoliday: e.isHoliday,
      })),
      ...exams.map((e) => ({
        id: e.id,
        kind: 'EXAM' as const,
        type: 'EXAM',
        title: e.name,
        startDate: formatDateOnly(e.startDate),
        endDate: formatDateOnly(e.endDate),
        isHoliday: false,
      })),
    ]
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
      .slice(0, 5);

    return {
      today: formatDateOnly(today),
      dayOfWeek: dayOfWeek(today),
      currency: ctx.currency,
      academicYear: year ? { id: year.id, name: year.name } : null,
      student: this.summary(ctx.student, enrollment),
      canApplyLeave: access.isGuardian,
      attendance: { ...yearSummary, thisMonth: monthSummary },
      fees: {
        currency: invoices[0]?.currency ?? ctx.currency,
        totalDue: fromPaise(due),
        overdueAmount: fromPaise(overdue),
        overdueCount,
        nextDueDate: nextDueDate ? formatDateOnly(nextDueDate) : null,
      },
      homework: {
        pendingCount,
        overdueCount: overdueHomework,
        dueSoon: dueSoon.map((h) => ({ id: h.id, title: h.title, subject: h.subject.name, dueDate: h.dueDate })),
      },
      latestResult,
      todayTimetable: timetable.map((t) => this.timetableEntry(t)),
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        excerpt: excerpt(n.content),
        priority: n.priority,
        publishedAt: n.publishedAt,
      })),
      upcomingEvents,
    };
  }

  // ---------------------------------------------------------------------------
  // Attendance (month calendar) + leave requests
  // ---------------------------------------------------------------------------
  async attendance(user: AuthUser, studentId: string, month?: string) {
    const access = await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { tenantId } = user;
    const { today } = ctx;

    const from = month ? parseDateOnly(`${month}-01`) : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0));

    const [records, leaves, holidays] = await Promise.all([
      this.attendanceRecords(tenantId, studentId, from, to),
      this.prisma.studentLeave.findMany({
        where: { tenantId, studentId },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          tenantId,
          deletedAt: null,
          isHoliday: true,
          targetRole: { in: this.audiences(access) },
          startDate: { lte: to },
          endDate: { gte: from },
        },
        select: { title: true, startDate: true, endDate: true },
      }),
    ]);

    const byDay = new Map(records.map((r) => [formatDateOnly(r.session.attendanceDate), r]));
    const activeLeaves = leaves.filter((l) => l.status !== 'REJECTED' && l.startDate <= to && l.endDate >= from);

    const days: {
      date: string;
      dayOfWeek: number;
      status: AttendanceStatus | null;
      remarks: string | null;
      holiday: string | null;
      leaveStatus: LeaveStatus | null;
      isFuture: boolean;
    }[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const key = formatDateOnly(d);
      const record = byDay.get(key);
      const holiday = holidays.find((h) => h.startDate <= d && h.endDate >= d);
      const leave = activeLeaves.find((l) => l.startDate <= d && l.endDate >= d);
      days.push({
        date: key,
        dayOfWeek: dayOfWeek(d),
        status: record?.status ?? null,
        remarks: record?.remarks ?? null,
        holiday: holiday?.title ?? null,
        leaveStatus: leave?.status ?? null,
        isFuture: d > today,
      });
    }

    return {
      month: key7(from),
      from: formatDateOnly(from),
      to: formatDateOnly(to),
      today: formatDateOnly(today),
      student: this.summary(ctx.student, ctx.enrollment),
      canApplyLeave: access.isGuardian,
      summary: this.summarize(records),
      days,
      leaves: leaves.map((l) => this.serializeLeave(l)),
    };
  }

  async applyLeave(user: AuthUser, studentId: string, dto: PortalLeaveDto) {
    const access = await this.access.assertCanView(user, studentId);
    if (!access.isGuardian) {
      throw new ForbiddenException('Only a parent or guardian can apply for leave. Please ask your parent to apply.');
    }
    const ctx = await this.context(user.tenantId, studentId);

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) throw new BadRequestException('End date must be on or after the start date');
    if (daysBetween(startDate, endDate) + 1 > MAX_LEAVE_DAYS) {
      throw new BadRequestException(`A leave request can cover at most ${MAX_LEAVE_DAYS} days`);
    }
    if (startDate < addDays(ctx.today, -MAX_BACKDATE_DAYS)) {
      throw new BadRequestException(`Leave cannot start more than ${MAX_BACKDATE_DAYS} days in the past`);
    }
    const reason = dto.reason.trim();
    if (!reason) throw new BadRequestException('Please give a reason for the leave');

    const overlap = await this.prisma.studentLeave.findFirst({
      where: {
        tenantId: user.tenantId,
        studentId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { startDate: true, endDate: true, status: true },
    });
    if (overlap) {
      throw new BadRequestException(
        `There is already a ${overlap.status.toLowerCase()} leave from ${formatDateOnly(overlap.startDate)} to ${formatDateOnly(
          overlap.endDate,
        )} that overlaps these dates`,
      );
    }

    const leave = await this.prisma.studentLeave.create({
      data: { tenantId: user.tenantId, studentId, startDate, endDate, reason },
    });
    await this.audit.log(user, 'CREATE', 'StudentLeave', leave.id, {
      student: personName(ctx.student),
      startDate: dto.startDate,
      endDate: dto.endDate,
      source: 'PORTAL',
    });
    return this.serializeLeave(leave);
  }

  // ---------------------------------------------------------------------------
  // Homework (the student's current section; only their own submission)
  // ---------------------------------------------------------------------------
  async homework(user: AuthUser, studentId: string, filter: HomeworkFilter = 'all') {
    await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { year, enrollment } = ctx;
    const empty = { student: this.summary(ctx.student, enrollment), counts: { all: 0, pending: 0, submitted: 0, overdue: 0 }, items: [] };
    if (!year || !enrollment) return empty;

    const now = new Date();
    const base = this.homeworkWhere(user.tenantId, enrollment.sectionId, year);
    const pending: Prisma.HomeworkWhereInput = { ...base, submissions: { none: { studentId } } };
    const submitted: Prisma.HomeworkWhereInput = { ...base, submissions: { some: { studentId } } };
    const where = filter === 'pending' ? pending : filter === 'submitted' ? submitted : base;

    const [all, pendingCount, overdue, rows] = await Promise.all([
      this.prisma.homework.count({ where: base }),
      this.prisma.homework.count({ where: pending }),
      this.prisma.homework.count({ where: { ...pending, dueDate: { lt: now } } }),
      this.prisma.homework.findMany({
        where,
        orderBy: { dueDate: filter === 'pending' ? 'asc' : 'desc' },
        take: 200,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          staff: { select: TEACHER_SELECT },
          submissions: {
            where: { studentId },
            select: { submittedAt: true, marks: true, feedback: true, gradedAt: true },
          },
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return {
      student: empty.student,
      counts: { all, pending: pendingCount, submitted: all - pendingCount, overdue },
      items: rows.map((h) => {
        const submission = h.submissions[0] ?? null;
        const isOverdue = !submission && h.dueDate < now;
        return {
          id: h.id,
          title: h.title,
          description: h.description,
          subject: h.subject,
          teacherName: personName(h.staff.user),
          dueDate: h.dueDate,
          maxMarks: h.maxMarks,
          assignedAt: h.createdAt,
          attachmentCount: h._count.attachments,
          isOverdue,
          status: submission ? (submission.gradedAt || submission.marks != null ? 'GRADED' : 'SUBMITTED') : isOverdue ? 'OVERDUE' : 'PENDING',
          submission: submission
            ? {
                submittedAt: submission.submittedAt,
                isLate: submission.submittedAt > h.dueDate,
                marks: submission.marks,
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
              }
            : null,
        };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Results (published exams only)
  // ---------------------------------------------------------------------------
  async results(user: AuthUser, studentId: string) {
    await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { tenantId } = user;
    const enrollmentByYear = new Map(ctx.student.enrollments.map((e) => [e.academicYearId, e]));
    if (!enrollmentByYear.size) return { student: this.summary(ctx.student, ctx.enrollment), exams: [] };

    const exams = await this.prisma.exam.findMany({
      where: { tenantId, deletedAt: null, isPublished: true, academicYearId: { in: [...enrollmentByYear.keys()] } },
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
      include: { academicYear: { select: { name: true } } },
    });
    const cards = exams.length
      ? await this.prisma.reportCard.findMany({
          where: { tenantId, studentId, examId: { in: exams.map((e) => e.id) } },
          select: { examId: true, remarks: true, overallPercent: true, grade: true, generatedAt: true },
        })
      : [];
    const cardByExam = new Map(cards.map((c) => [c.examId, c]));

    const results = [];
    for (const exam of exams) {
      const enrollment = enrollmentByYear.get(exam.academicYearId)!;
      results.push(await this.examResult(tenantId, studentId, exam, enrollment, cardByExam.get(exam.id) ?? null));
    }
    return { student: this.summary(ctx.student, ctx.enrollment), exams: results };
  }

  // ---------------------------------------------------------------------------
  // Fees (invoices + payments of this student only)
  // ---------------------------------------------------------------------------
  async fees(user: AuthUser, studentId: string) {
    await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { tenantId } = user;
    const { today } = ctx;

    const [invoices, payments] = await Promise.all([
      this.prisma.studentInvoice.findMany({
        where: { tenantId, studentId, deletedAt: null, status: { not: 'VOID' } },
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          academicYear: { select: { name: true } },
          items: { select: { id: true, title: true, unitAmount: true, quantity: true, discountAmount: true, totalAmount: true } },
        },
      }),
      this.prisma.feePayment.findMany({
        where: { tenantId, allocations: { some: { invoice: { tenantId, studentId } } } },
        orderBy: { paidAt: 'desc' },
        take: 100,
        select: {
          id: true,
          receiptNumber: true,
          amount: true,
          paymentMethod: true,
          paidAt: true,
          allocations: {
            where: { invoice: { tenantId, studentId } },
            select: { allocatedAmount: true, invoice: { select: { id: true, invoiceNumber: true } } },
          },
          refunds: { select: { amount: true, status: true } },
        },
      }),
    ]);

    let billed = 0;
    let paid = 0;
    let due = 0;
    let overdue = 0;
    let overdueCount = 0;
    let nextDueDate: Date | null = null;

    const invoiceRows = invoices.map((inv) => {
      const balance = paise(inv.balanceAmount);
      const isOverdue = balance > 0 && inv.dueDate < today;
      billed += paise(inv.totalAmount);
      paid += paise(inv.paidAmount);
      due += balance;
      if (isOverdue) {
        overdue += balance;
        overdueCount += 1;
      } else if (balance > 0 && (!nextDueDate || inv.dueDate < nextDueDate)) {
        nextDueDate = inv.dueDate;
      }
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        academicYear: inv.academicYear.name,
        currency: inv.currency,
        subtotal: inv.subtotal,
        discountTotal: inv.discountTotal,
        taxTotal: inv.taxTotal,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        balanceAmount: inv.balanceAmount,
        status: inv.status,
        dueDate: formatDateOnly(inv.dueDate),
        isOverdue,
        createdAt: inv.createdAt,
        items: inv.items,
      };
    });

    return {
      student: this.summary(ctx.student, ctx.enrollment),
      today: formatDateOnly(today),
      currency: invoices[0]?.currency ?? ctx.currency,
      totals: {
        billed: fromPaise(billed),
        paid: fromPaise(paid),
        due: fromPaise(due),
        overdue: fromPaise(overdue),
        overdueCount,
        nextDueDate: nextDueDate ? formatDateOnly(nextDueDate) : null,
      },
      invoices: invoiceRows,
      payments: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        method: p.paymentMethod,
        paidAt: p.paidAt,
        refunded: fromPaise(p.refunds.filter((r) => r.status !== 'FAILED').reduce((s, r) => s + paise(r.amount), 0)),
        invoices: p.allocations.map((a) => ({ id: a.invoice.id, invoiceNumber: a.invoice.invoiceNumber, amount: a.allocatedAmount })),
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Weekly timetable of the current section
  // ---------------------------------------------------------------------------
  async timetable(user: AuthUser, studentId: string) {
    await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { year, enrollment, today } = ctx;
    const entries =
      year && enrollment
        ? await this.prisma.timetable.findMany({
            where: { tenantId: user.tenantId, academicYearId: year.id, sectionId: enrollment.sectionId },
            orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
            include: { subject: { select: { name: true, code: true } }, staff: { select: TEACHER_SELECT } },
          })
        : [];
    return {
      student: this.summary(ctx.student, enrollment),
      academicYear: year ? { id: year.id, name: year.name } : null,
      today: formatDateOnly(today),
      dayOfWeek: dayOfWeek(today),
      entries: entries.map((t) => this.timetableEntry(t)),
    };
  }

  // ---------------------------------------------------------------------------
  // Library issues + transport assignment
  // ---------------------------------------------------------------------------
  async services(user: AuthUser, studentId: string) {
    await this.access.assertCanView(user, studentId);
    const ctx = await this.context(user.tenantId, studentId);
    const { tenantId } = user;
    const { today } = ctx;

    const bookSelect = { select: { id: true, title: true, author: true, isbn: true } } as const;
    const [current, history, assignment] = await Promise.all([
      this.prisma.bookIssue.findMany({
        where: { tenantId, studentId, returnedAt: null },
        orderBy: { dueDate: 'asc' },
        include: { book: bookSelect },
      }),
      this.prisma.bookIssue.findMany({
        where: { tenantId, studentId, returnedAt: { not: null } },
        orderBy: { returnedAt: 'desc' },
        take: 10,
        include: { book: bookSelect },
      }),
      this.prisma.studentTransport.findFirst({
        where: {
          tenantId,
          studentId,
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: today } }],
          route: { tenantId, deletedAt: null },
        },
        orderBy: { startDate: 'desc' },
        include: { route: { include: { vehicle: true } }, stop: true },
      }),
    ]);

    const issue = (i: (typeof current)[number]) => {
      const overdueDays = !i.returnedAt && i.dueDate < today ? daysBetween(i.dueDate, today) : 0;
      return {
        id: i.id,
        book: i.book,
        issuedAt: i.issuedAt,
        dueDate: formatDateOnly(i.dueDate),
        returnedAt: i.returnedAt,
        isOverdue: overdueDays > 0,
        overdueDays,
        fineAmount: i.fineAmount,
        finePaid: i.finePaid,
      };
    };

    const vehicle = assignment?.route.vehicle && !assignment.route.vehicle.deletedAt ? assignment.route.vehicle : null;

    return {
      student: this.summary(ctx.student, ctx.enrollment),
      today: formatDateOnly(today),
      currency: ctx.currency,
      library: {
        current: current.map(issue),
        history: history.map(issue),
        overdueCount: current.filter((i) => i.dueDate < today).length,
        unpaidFines: fromPaise(
          [...current, ...history].filter((i) => !i.finePaid).reduce((s, i) => s + paise(i.fineAmount), 0),
        ),
      },
      transport: assignment
        ? {
            id: assignment.id,
            startDate: formatDateOnly(assignment.startDate),
            endDate: assignment.endDate ? formatDateOnly(assignment.endDate) : null,
            route: { id: assignment.route.id, name: assignment.route.name, code: assignment.route.code },
            stop: assignment.stop
              ? {
                  id: assignment.stop.id,
                  name: assignment.stop.name,
                  pickupTime: assignment.stop.pickupTime,
                  dropTime: assignment.stop.dropTime,
                }
              : null,
            vehicle: vehicle
              ? {
                  registrationNumber: vehicle.registrationNumber,
                  model: vehicle.model,
                  driverName: vehicle.driverName,
                  driverPhone: vehicle.driverPhone,
                  helperName: vehicle.helperName,
                  helperPhone: vehicle.helperPhone,
                }
              : null,
          }
        : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private currentYear(tenantId: string): Promise<YearRow | null> {
    return this.prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true, deletedAt: null },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
  }

  // Loads what every endpoint needs. Callers must have run assertCanView first.
  private async context(tenantId: string, studentId: string) {
    const [settings, year, student] = await Promise.all([
      this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true, currency: true } }),
      this.currentYear(tenantId),
      this.prisma.student.findFirst({ where: { id: studentId, tenantId, deletedAt: null }, select: STUDENT_SELECT }),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    const timezone = settings?.timezone || 'Asia/Kolkata';
    return {
      timezone,
      currency: settings?.currency || 'INR',
      today: todayDateOnly(timezone),
      year,
      student,
      enrollment: this.enrollmentFor(student, year),
    };
  }

  private enrollmentFor(student: StudentRow, year: YearRow | null) {
    return year ? (student.enrollments.find((e) => e.academicYearId === year.id) ?? null) : null;
  }

  private summary(student: StudentRow, enrollment: EnrollmentRow | null) {
    return {
      id: student.id,
      name: personName(student),
      firstName: student.firstName,
      admissionNumber: student.admissionNumber,
      photoUrl: student.photoUrl,
      status: student.status,
      sectionId: enrollment?.sectionId ?? null,
      sectionLabel: enrollment ? sectionLabel(enrollment.section) : null,
      rollNumber: enrollment?.rollNumber ?? null,
    };
  }

  // Notice / calendar audiences for this viewer. Parents also see notices meant for students.
  private audiences(access: StudentAccess) {
    return ['ALL', 'STUDENT', ...(access.isGuardian ? ['PARENT'] : [])];
  }

  // Homework of the section for the current academic year.
  private homeworkWhere(tenantId: string, sectionId: string, year: YearRow): Prisma.HomeworkWhereInput {
    return { tenantId, sectionId, deletedAt: null, dueDate: { gte: year.startDate } };
  }

  // Daily (period 0) attendance of one student in a date range.
  private attendanceRecords(tenantId: string, studentId: string, from: Date, to: Date) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentId, session: { tenantId, periodNumber: 0, attendanceDate: { gte: from, lte: to } } },
      select: { status: true, remarks: true, session: { select: { attendanceDate: true } } },
    });
  }

  private summarize(records: { status: AttendanceStatus }[]) {
    const count = (s: AttendanceStatus) => records.filter((r) => r.status === s).length;
    const present = count('PRESENT');
    const late = count('LATE');
    const total = records.length;
    return { present, absent: count('ABSENT'), late, excused: count('EXCUSED'), total, percent: pct(present + late, total) };
  }

  private timetableEntry(t: {
    id: string;
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber: string | null;
    subject: { name: string; code: string };
    staff: { user: { firstName: string | null; lastName: string | null } };
  }) {
    return {
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      periodNumber: t.periodNumber,
      startTime: t.startTime,
      endTime: t.endTime,
      roomNumber: t.roomNumber,
      subject: t.subject,
      teacherName: personName(t.staff.user),
    };
  }

  private serializeLeave(l: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveStatus;
    actionReason: string | null;
    createdAt: Date;
  }) {
    return {
      id: l.id,
      startDate: formatDateOnly(l.startDate),
      endDate: formatDateOnly(l.endDate),
      days: daysBetween(l.startDate, l.endDate) + 1,
      reason: l.reason,
      status: l.status,
      actionReason: l.actionReason,
      createdAt: l.createdAt,
    };
  }

  // The most recent published exam in which the student has marks.
  private async latestResult(tenantId: string, student: StudentRow) {
    const enrollmentByYear = new Map(student.enrollments.map((e) => [e.academicYearId, e]));
    if (!enrollmentByYear.size) return null;
    const exams = await this.prisma.exam.findMany({
      where: { tenantId, deletedAt: null, isPublished: true, academicYearId: { in: [...enrollmentByYear.keys()] } },
      orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }],
      take: 3,
      include: { academicYear: { select: { name: true } } },
    });
    for (const exam of exams) {
      const result = await this.examResult(tenantId, student.id, exam, enrollmentByYear.get(exam.academicYearId)!, null);
      if (result.percent != null) {
        return {
          examId: exam.id,
          examName: exam.name,
          percent: result.percent,
          grade: result.grade,
          result: result.result,
          rank: result.rank,
          classSize: result.classSize,
        };
      }
    }
    return null;
  }

  // One exam's result for one student. Ranks/averages are computed over the
  // section, but only this student's own marks are returned.
  private async examResult(
    tenantId: string,
    studentId: string,
    exam: Prisma.ExamGetPayload<{ include: { academicYear: { select: { name: true } } } }>,
    enrollment: EnrollmentRow,
    card: { remarks: string | null } | null,
  ) {
    const { papers, sections, markMap } = await this.marks.computeExamResults(tenantId, exam, enrollment.sectionId);
    const section = sections.get(enrollment.sectionId);
    const row = section?.students.find((r) => r.studentId === studentId) ?? null;
    const own = markMap.get(studentId);

    const subjects = papers.map((p) => {
      const cell = own?.get(p.examSubjectId);
      const percent = cell ? percentOf(cell.marksObtained, p.maxMarks) : null;
      return {
        examSubjectId: p.examSubjectId,
        name: p.subjectName,
        code: p.subjectCode,
        examDate: formatDateOnly(p.examDate),
        maxMarks: p.maxMarks,
        passingMarks: p.passingMarks,
        marksObtained: cell ? cell.marksObtained : null,
        percent,
        grade: gradeFor(percent),
        passed: cell ? cell.marksObtained >= p.passingMarks : null,
        remarks: cell?.remarks ?? null,
      };
    });

    const grade = row?.grade ?? null;
    return {
      exam: {
        id: exam.id,
        name: exam.name,
        startDate: formatDateOnly(exam.startDate),
        endDate: formatDateOnly(exam.endDate),
        academicYear: exam.academicYear.name,
      },
      sectionLabel: sectionLabel(enrollment.section),
      rollNumber: enrollment.rollNumber,
      hasMarks: row?.percent != null,
      subjects,
      total: row?.total ?? 0,
      maxTotal: row?.maxTotal ?? 0,
      percent: row?.percent ?? null,
      grade,
      result: row?.result ?? null,
      rank: row?.rank ?? null,
      classSize: section?.sectionStats.appeared ?? 0,
      classAverage: section?.sectionStats.average ?? null,
      remarks: card?.remarks ?? autoRemark(grade),
    };
  }
}

