import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import {
  CalendarEventsQueryDto,
  CalendarRangeQueryDto,
  CalendarTarget,
  CreateCalendarEventDto,
  ImportHolidaysDto,
  UpdateCalendarEventDto,
  UpcomingEventsQueryDto,
} from './dto/calendar.dto';

// Same audience matching as notices: everyone sees ALL; student and parent
// roles see their own audience; every other (staff) role sees STAFF.
const PORTAL_AUDIENCES: Record<string, CalendarTarget> = { STUDENT: 'STUDENT', PARENT: 'PARENT' };

// Fixed-date Indian national holidays (lunar festivals vary every year and
// must be added by the school).
const NATIONAL_HOLIDAYS = [
  { title: 'Republic Day', month: 1, day: 26 },
  { title: 'Independence Day', month: 8, day: 15 },
  { title: 'Gandhi Jayanti', month: 10, day: 2 },
];

// Largest range a single request may cover (keeps holiday expansion bounded).
const MAX_RANGE_DAYS = 400;

type EventRow = Prisma.CalendarEventGetPayload<object>;

export interface CalendarItem {
  source: 'CALENDAR' | 'EXAM';
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: Date;
  endDate: Date;
  isHoliday: boolean;
  targetRole: string;
  readOnly: boolean;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  canManage(user: AuthUser) {
    return user.isAdmin || user.permissions.includes(PERMISSIONS.CALENDAR_MANAGE);
  }

  private visibilityWhere(user: AuthUser): Prisma.CalendarEventWhereInput {
    if (this.canManage(user)) return {};
    const audiences = new Set<CalendarTarget>(['ALL']);
    user.roles.forEach((role) => audiences.add(PORTAL_AUDIENCES[role] ?? 'STAFF'));
    return { targetRole: { in: [...audiences] } };
  }

  // ---------------------------------------------------------------- reads

  async events(user: AuthUser, query: CalendarEventsQueryDto) {
    const { from, to } = await this.resolveRange(user.tenantId, query);
    const includeExams = !query.type || query.type === 'EXAM';

    const [events, exams] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          AND: [
            { tenantId: user.tenantId, deletedAt: null, startDate: { lte: to }, endDate: { gte: from } },
            query.type ? { type: query.type } : {},
            this.visibilityWhere(user),
          ],
        },
        orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
      }),
      includeExams ? this.examsInRange(user.tenantId, { startDate: { lte: to }, endDate: { gte: from } }) : [],
    ]);

    return this.sortItems([...events.map((e) => this.mapEvent(e)), ...exams]);
  }

  async upcoming(user: AuthUser, query: UpcomingEventsQueryDto) {
    const limit = query.limit ?? 5;
    const today = await this.today(user.tenantId);
    const [events, exams] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          AND: [{ tenantId: user.tenantId, deletedAt: null, endDate: { gte: today } }, this.visibilityWhere(user)],
        },
        orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
        take: limit,
      }),
      this.examsInRange(user.tenantId, { endDate: { gte: today } }, limit),
    ]);
    return this.sortItems([...events.map((e) => this.mapEvent(e)), ...exams]).slice(0, limit);
  }

  // Holiday dates (isHoliday or type HOLIDAY) expanded day by day.
  async holidays(user: AuthUser, query: CalendarRangeQueryDto) {
    const { from, to } = await this.resolveRange(user.tenantId, query);
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        AND: [
          { tenantId: user.tenantId, deletedAt: null, startDate: { lte: to }, endDate: { gte: from } },
          { OR: [{ isHoliday: true }, { type: 'HOLIDAY' }] },
          this.visibilityWhere(user),
        ],
      },
      orderBy: { startDate: 'asc' },
      select: { id: true, title: true, startDate: true, endDate: true },
    });

    const byDate = new Map<string, string[]>();
    for (const event of events) {
      const start = event.startDate > from ? event.startDate : from;
      const end = event.endDate < to ? event.endDate : to;
      for (let day = start; day <= end; day = addDays(day, 1)) {
        const key = formatDateOnly(day);
        byDate.set(key, [...(byDate.get(key) ?? []), event.title]);
      }
    }
    const dates = [...byDate.keys()].sort();
    return {
      from: formatDateOnly(from),
      to: formatDateOnly(to),
      dates,
      details: dates.map((date) => ({ date, titles: byDate.get(date) ?? [] })),
    };
  }

  // ---------------------------------------------------------------- writes

  async create(user: AuthUser, dto: CreateCalendarEventDto) {
    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) throw new BadRequestException('End date cannot be before the start date');

    const event = await this.prisma.calendarEvent.create({
      data: {
        tenantId: user.tenantId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        type: dto.type,
        startDate,
        endDate,
        isHoliday: dto.isHoliday ?? dto.type === 'HOLIDAY',
        targetRole: dto.targetRole ?? 'ALL',
        createdById: user.id,
      },
    });
    await this.audit.log(user, 'CREATE', 'CalendarEvent', event.id, {
      title: event.title,
      type: event.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return this.mapEvent(event);
  }

  async update(user: AuthUser, id: string, dto: UpdateCalendarEventDto) {
    const existing = await this.findOrThrow(user.tenantId, id);
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : existing.endDate;
    if (endDate < startDate) throw new BadRequestException('End date cannot be before the start date');

    // Changing the type re-derives the holiday flag unless it is sent explicitly.
    const isHoliday =
      dto.isHoliday !== undefined
        ? dto.isHoliday
        : dto.type && dto.type !== existing.type
          ? dto.type === 'HOLIDAY'
          : undefined;

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        ...(dto.description !== undefined && { description: dto.description.trim() || null }),
        type: dto.type,
        startDate,
        endDate,
        isHoliday,
        targetRole: dto.targetRole,
      },
    });
    await this.audit.log(user, 'UPDATE', 'CalendarEvent', id, { ...dto });
    return this.mapEvent(event);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.findOrThrow(user.tenantId, id);
    await this.prisma.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'CalendarEvent', id, { title: existing.title });
    return { id, deleted: true };
  }

  async importHolidays(user: AuthUser, dto: ImportHolidaysDto) {
    const candidates = NATIONAL_HOLIDAYS.map((h) => ({
      title: h.title,
      date: parseDateOnly(`${dto.year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`),
    }));

    const existing = await this.prisma.calendarEvent.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        OR: candidates.map((c) => ({ title: { equals: c.title, mode: 'insensitive' as const }, startDate: c.date })),
      },
      select: { title: true, startDate: true },
    });
    const present = new Set(existing.map((e) => `${e.title.toLowerCase()}|${formatDateOnly(e.startDate)}`));
    const toCreate = candidates.filter((c) => !present.has(`${c.title.toLowerCase()}|${formatDateOnly(c.date)}`));

    if (toCreate.length) {
      await this.prisma.calendarEvent.createMany({
        data: toCreate.map((c) => ({
          tenantId: user.tenantId,
          title: c.title,
          description: 'National holiday',
          type: 'HOLIDAY' as const,
          startDate: c.date,
          endDate: c.date,
          isHoliday: true,
          targetRole: 'ALL',
          createdById: user.id,
        })),
      });
      await this.audit.log(user, 'IMPORT_HOLIDAYS', 'CalendarEvent', null, {
        year: dto.year,
        created: toCreate.map((c) => c.title),
      });
    }

    return {
      year: dto.year,
      created: toCreate.length,
      skipped: candidates.length - toCreate.length,
      holidays: toCreate.map((c) => ({ title: c.title, date: formatDateOnly(c.date) })),
    };
  }

  // ---------------------------------------------------------------- helpers

  private async examsInRange(tenantId: string, where: Prisma.ExamWhereInput, take?: number): Promise<CalendarItem[]> {
    const exams = await this.prisma.exam.findMany({
      where: { tenantId, deletedAt: null, ...where },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, startDate: true, endDate: true, academicYear: { select: { name: true } } },
      take,
    });
    return exams.map((exam) => ({
      source: 'EXAM' as const,
      id: exam.id,
      title: exam.name,
      description: `Examination · ${exam.academicYear.name}`,
      type: 'EXAM',
      startDate: exam.startDate,
      endDate: exam.endDate,
      isHoliday: false,
      targetRole: 'ALL',
      readOnly: true,
    }));
  }

  private mapEvent(event: EventRow): CalendarItem {
    return {
      source: 'CALENDAR',
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      isHoliday: event.isHoliday,
      targetRole: event.targetRole,
      readOnly: false,
    };
  }

  private sortItems(items: CalendarItem[]) {
    return items.sort(
      (a, b) =>
        a.startDate.getTime() - b.startDate.getTime() ||
        b.endDate.getTime() - a.endDate.getTime() ||
        a.title.localeCompare(b.title),
    );
  }

  private async today(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return todayDateOnly(settings?.timezone || 'Asia/Kolkata');
  }

  // Defaults to the current month (school timezone).
  private async resolveRange(tenantId: string, query: CalendarRangeQueryDto) {
    let from: Date;
    let to: Date;
    if (query.from && query.to) {
      from = parseDateOnly(query.from);
      to = parseDateOnly(query.to);
    } else {
      const today = await this.today(tenantId);
      const anchor = query.from ? parseDateOnly(query.from) : query.to ? parseDateOnly(query.to) : today;
      const monthStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
      const monthEnd = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
      from = query.from ? parseDateOnly(query.from) : monthStart;
      to = query.to ? parseDateOnly(query.to) : monthEnd;
    }
    if (to < from) throw new BadRequestException("'to' cannot be before 'from'");
    if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
      throw new BadRequestException(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
    }
    return { from, to };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }
}
