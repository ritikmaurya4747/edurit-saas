import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, formatDateOnly, todayDateOnly } from '../../common/utils/date';
import { zonedDayStart } from '../dashboard/utils/zoned-time';

export type NotificationSeverity = 'info' | 'warning' | 'danger';

export interface NotificationItem {
  // Stable id, so the client can tell which items it has already seen.
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  description: string;
  href: string;
  count?: number;
  // When the underlying event happened (drives the unread badge).
  createdAt: Date;
}

// Audiences (notices / calendar targetRole) a role can see in addition to ALL.
const ROLE_AUDIENCES: Record<string, string[]> = {
  ADMIN: ['STAFF'],
  TEACHER: ['STAFF', 'TEACHER'],
  ACCOUNTANT: ['STAFF'],
  STAFF: ['STAFF'],
  STUDENT: ['STUDENT'],
  PARENT: ['PARENT'],
};

const MAX_ITEMS = 25;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The bell in the dashboard header. Everything is computed from live ERP data
// (no notification table): each check only runs when the user may act on it.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
      select: { timezone: true },
    });
    const timeZone = settings?.timezone ?? 'Asia/Kolkata';
    const today = todayDateOnly(timeZone);
    const ctx = { user, tenantId: user.tenantId, timeZone, today, todayStart: zonedDayStart(today, timeZone) };

    const can = (permission: string) => user.isAdmin || user.permissions.includes(permission);
    const checks: Promise<NotificationItem[]>[] = [this.notices(ctx), this.upcomingEvents(ctx)];

    if (can(PERMISSIONS.ATTENDANCE_APPROVE_LEAVE)) checks.push(this.pendingStudentLeaves(ctx));
    if (can(PERMISSIONS.STAFF_LEAVE_APPROVE)) checks.push(this.pendingStaffLeaves(ctx));
    if (can(PERMISSIONS.ATTENDANCE_MARK)) checks.push(this.attendanceNotMarked(ctx));
    if (can(PERMISSIONS.ADMISSIONS_READ)) checks.push(this.newEnquiries(ctx));
    if (can(PERMISSIONS.INVOICE_READ)) checks.push(this.overdueFees(ctx));
    if (can(PERMISSIONS.OPERATIONS_READ)) checks.push(this.lowStock(ctx), this.complianceDue(ctx));
    if (can(PERMISSIONS.LIBRARY_READ)) checks.push(this.overdueBooks(ctx));
    if (can(PERMISSIONS.TRANSPORT_READ)) checks.push(this.vehicleDocuments(ctx));
    if (user.roles.some((r) => r === 'STUDENT' || r === 'PARENT')) checks.push(this.portalAlerts(ctx));

    // One failing check must not break the bell.
    const results = await Promise.allSettled(checks);
    const items = results.flatMap((r) => {
      if (r.status === 'fulfilled') return r.value;
      this.logger.warn(`Notification check failed: ${(r.reason as Error)?.message}`);
      return [];
    });

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: items.slice(0, MAX_ITEMS), generatedAt: new Date() };
  }

  private audiences(user: AuthUser) {
    const set = new Set<string>(['ALL']);
    user.roles.forEach((role) => (ROLE_AUDIENCES[role] ?? []).forEach((a) => set.add(a)));
    return [...set];
  }

  private async notices({ user, tenantId }: Ctx): Promise<NotificationItem[]> {
    const notices = await this.prisma.notice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'PUBLISHED',
        targetRole: { in: this.audiences(user) },
        publishedAt: { gte: addDays(new Date(), -7) },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, priority: true, publishedAt: true },
    });
    return notices.map((n) => ({
      id: `notice:${n.id}`,
      type: 'NOTICE',
      severity: n.priority === 'ALERT' ? 'danger' : 'info',
      title: n.title,
      description: n.content.length > 90 ? `${n.content.slice(0, 90)}…` : n.content,
      href: '/dashboard/notice',
      createdAt: n.publishedAt,
    }));
  }

  private async upcomingEvents({ user, tenantId, today }: Ctx): Promise<NotificationItem[]> {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        tenantId,
        deletedAt: null,
        targetRole: { in: this.audiences(user) },
        startDate: { gte: today, lte: addDays(today, 3) },
      },
      orderBy: { startDate: 'asc' },
      take: 3,
    });
    return events.map((e) => {
      const days = Math.round((e.startDate.getTime() - today.getTime()) / 86_400_000);
      const when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `On ${formatDateOnly(e.startDate)}`;
      return {
        id: `event:${e.id}`,
        type: 'EVENT',
        severity: 'info',
        title: e.isHoliday ? `Holiday: ${e.title}` : e.title,
        description: `${when}${e.description ? ` · ${e.description.slice(0, 70)}` : ''}`,
        href: '/dashboard/calendar',
        createdAt: e.createdAt,
      };
    });
  }

  private async pendingStudentLeaves({ tenantId }: Ctx): Promise<NotificationItem[]> {
    const agg = await this.prisma.studentLeave.aggregate({
      where: { tenantId, status: 'PENDING' },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const count = agg._count._all;
    if (!count) return [];
    return [
      {
        id: 'student-leaves',
        type: 'APPROVAL',
        severity: 'warning',
        title: `${plural(count, 'student leave request')} pending`,
        description: 'Review and approve or reject in Attendance → Leave Requests.',
        href: '/dashboard/attendance',
        count,
        createdAt: agg._max.createdAt ?? new Date(),
      },
    ];
  }

  private async pendingStaffLeaves({ tenantId }: Ctx): Promise<NotificationItem[]> {
    const agg = await this.prisma.staffLeave.aggregate({
      where: { tenantId, status: 'PENDING' },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const count = agg._count._all;
    if (!count) return [];
    return [
      {
        id: 'staff-leaves',
        type: 'APPROVAL',
        severity: 'warning',
        title: `${plural(count, 'staff leave request')} pending`,
        description: 'Approve or reject in Staff & HR → Leave management.',
        href: '/dashboard/staff-hr',
        count,
        createdAt: agg._max.createdAt ?? new Date(),
      },
    ];
  }

  // Sections without today's attendance (skipped on Sundays and holidays).
  private async attendanceNotMarked({ tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    if (today.getUTCDay() === 0) return [];
    const [holiday, year] = await Promise.all([
      this.prisma.calendarEvent.findFirst({
        where: { tenantId, deletedAt: null, isHoliday: true, startDate: { lte: today }, endDate: { gte: today } },
        select: { id: true },
      }),
      this.prisma.academicYear.findFirst({ where: { tenantId, isCurrent: true, deletedAt: null }, select: { id: true } }),
    ]);
    if (holiday || !year) return [];

    const [sectionRows, marked] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where: { tenantId, academicYearId: year.id, student: { deletedAt: null, status: 'ACTIVE' } },
        distinct: ['sectionId'],
        select: { sectionId: true },
      }),
      this.prisma.attendanceSession.count({ where: { tenantId, attendanceDate: today, periodNumber: 0 } }),
    ]);
    const pending = sectionRows.length - marked;
    if (pending <= 0) return [];
    return [
      {
        id: `attendance:${formatDateOnly(today)}`,
        type: 'ATTENDANCE',
        severity: 'warning',
        title: `Attendance not marked for ${plural(pending, 'section')}`,
        description: `${marked} of ${sectionRows.length} sections are done for today.`,
        href: '/dashboard/attendance',
        count: pending,
        createdAt: todayStart,
      },
    ];
  }

  private async newEnquiries({ tenantId }: Ctx): Promise<NotificationItem[]> {
    const agg = await this.prisma.admissionEnquiry.aggregate({
      where: { tenantId, stage: 'ENQUIRY', createdAt: { gte: addDays(new Date(), -7) } },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const count = agg._count._all;
    if (!count) return [];
    return [
      {
        id: 'admission-enquiries',
        type: 'ADMISSION',
        severity: 'info',
        title: `${plural(count, 'new admission enquiry', 'new admission enquiries')}`,
        description: 'Received in the last 7 days and waiting for follow-up.',
        href: '/dashboard/admissions',
        count,
        createdAt: agg._max.createdAt ?? new Date(),
      },
    ];
  }

  private async overdueFees({ tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    const agg = await this.prisma.studentInvoice.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        balanceAmount: { gt: 0 },
        dueDate: { lt: today },
      },
      _count: { _all: true },
      _sum: { balanceAmount: true },
    });
    const count = agg._count._all;
    if (!count) return [];
    const amount = Number(agg._sum.balanceAmount ?? 0).toLocaleString('en-IN');
    return [
      {
        id: `fees-overdue:${formatDateOnly(today)}`,
        type: 'FEES',
        severity: 'danger',
        title: `${plural(count, 'fee invoice')} overdue`,
        description: `₹${amount} pending past due date. See Fee Management → Defaulters.`,
        href: '/dashboard/fee-management',
        count,
        createdAt: todayStart,
      },
    ];
  }

  private async lowStock({ tenantId, todayStart, today }: Ctx): Promise<NotificationItem[]> {
    const count = await this.prisma.inventoryItem.count({
      where: { tenantId, deletedAt: null, quantity: { lte: this.prisma.inventoryItem.fields.reorderLevel } },
    });
    if (!count) return [];
    return [
      {
        id: `low-stock:${formatDateOnly(today)}`,
        type: 'INVENTORY',
        severity: 'warning',
        title: `${plural(count, 'inventory item')} low on stock`,
        description: 'At or below the reorder level. Restock from Front Office → Inventory.',
        href: '/dashboard/operations',
        count,
        createdAt: todayStart,
      },
    ];
  }

  private async complianceDue({ tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    const records = await this.prisma.complianceRecord.findMany({
      where: { tenantId, deletedAt: null, status: { not: 'COMPLIANT' }, dueDate: { lte: addDays(today, 7) } },
      orderBy: { dueDate: 'asc' },
      take: 3,
      select: { id: true, title: true, dueDate: true },
    });
    return records.map((r) => {
      const overdue = r.dueDate < today;
      return {
        id: `compliance:${r.id}:${overdue ? 'overdue' : 'due'}`,
        type: 'COMPLIANCE',
        severity: overdue ? 'danger' : 'warning',
        title: `${r.title} ${overdue ? 'is overdue' : 'is due soon'}`,
        description: `Due date ${formatDateOnly(r.dueDate)}.`,
        href: '/dashboard/operations',
        createdAt: todayStart,
      };
    });
  }

  private async overdueBooks({ tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    const count = await this.prisma.bookIssue.count({
      where: { tenantId, returnedAt: null, dueDate: { lt: today } },
    });
    if (!count) return [];
    return [
      {
        id: `library-overdue:${formatDateOnly(today)}`,
        type: 'LIBRARY',
        severity: 'warning',
        title: `${plural(count, 'library book')} overdue`,
        description: 'Not returned by the due date.',
        href: '/dashboard/library',
        count,
        createdAt: todayStart,
      },
    ];
  }

  private async vehicleDocuments({ tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    const limit = addDays(today, 15);
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        OR: [{ insuranceExpiry: { lte: limit } }, { fitnessExpiry: { lte: limit } }],
      },
      select: { id: true, registrationNumber: true, insuranceExpiry: true, fitnessExpiry: true },
      take: 5,
    });
    return vehicles.map((v) => {
      const docs = [
        v.insuranceExpiry && v.insuranceExpiry <= limit ? `insurance (${formatDateOnly(v.insuranceExpiry)})` : null,
        v.fitnessExpiry && v.fitnessExpiry <= limit ? `fitness (${formatDateOnly(v.fitnessExpiry)})` : null,
      ].filter(Boolean);
      const expired = [v.insuranceExpiry, v.fitnessExpiry].some((d) => d && d < today);
      return {
        id: `vehicle-docs:${v.id}`,
        type: 'TRANSPORT',
        severity: expired ? 'danger' : 'warning',
        title: `${v.registrationNumber}: documents ${expired ? 'expired' : 'expiring soon'}`,
        description: `Check ${docs.join(' and ')}.`,
        href: '/dashboard/transport',
        createdAt: todayStart,
      };
    });
  }

  // Students & parents: homework due soon and overdue fees for their children.
  private async portalAlerts({ user, tenantId, today, todayStart }: Ctx): Promise<NotificationItem[]> {
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ userId: user.id }, { guardians: { some: { parent: { userId: user.id, tenantId } } } }],
      },
      select: {
        id: true,
        firstName: true,
        enrollments: { where: { academicYear: { isCurrent: true } }, select: { sectionId: true }, take: 1 },
      },
    });
    if (!students.length) return [];

    const items: NotificationItem[] = [];
    for (const student of students) {
      const sectionId = student.enrollments[0]?.sectionId;
      const [homework, overdue] = await Promise.all([
        sectionId
          ? this.prisma.homework.findMany({
              where: {
                tenantId,
                sectionId,
                deletedAt: null,
                dueDate: { gte: new Date(), lte: addDays(new Date(), 2) },
                submissions: { none: { studentId: student.id } },
              },
              select: { id: true, title: true, dueDate: true, createdAt: true, subject: { select: { name: true } } },
              take: 3,
            })
          : Promise.resolve([]),
        this.prisma.studentInvoice.aggregate({
          where: {
            tenantId,
            studentId: student.id,
            deletedAt: null,
            status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
            balanceAmount: { gt: 0 },
            dueDate: { lt: today },
          },
          _sum: { balanceAmount: true },
          _count: { _all: true },
        }),
      ]);

      homework.forEach((h) =>
        items.push({
          id: `homework:${h.id}:${student.id}`,
          type: 'HOMEWORK',
          severity: 'info',
          title: `${h.subject.name} homework due soon`,
          description: `${student.firstName}: "${h.title}"`,
          href: `/dashboard/my/homework?studentId=${student.id}`,
          createdAt: h.createdAt,
        }),
      );
      if (overdue._count._all > 0) {
        items.push({
          id: `my-fees:${student.id}:${formatDateOnly(today)}`,
          type: 'FEES',
          severity: 'danger',
          title: `Fee overdue for ${student.firstName}`,
          description: `₹${Number(overdue._sum.balanceAmount ?? 0).toLocaleString('en-IN')} pending. Please pay at the school office.`,
          href: `/dashboard/my/fees?studentId=${student.id}`,
          createdAt: todayStart,
        });
      }
    }
    return items;
  }
}

interface Ctx {
  user: AuthUser;
  tenantId: string;
  timeZone: string;
  today: Date;
  todayStart: Date;
}

