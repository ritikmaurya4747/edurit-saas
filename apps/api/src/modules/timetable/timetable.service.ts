import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { AcademicYearsService } from '../academic/academic-years.service';
import { CopyTimetableDto, UpsertTimetableEntryDto } from './dto/timetable.dto';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SECTION_SELECT = { id: true, name: true, class: { select: { name: true } } } as const;

const ENTRY_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  staff: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  section: { select: SECTION_SELECT },
} satisfies Prisma.TimetableInclude;

type EntryRow = Prisma.TimetableGetPayload<{ include: typeof ENTRY_INCLUDE }>;

const personName = (p?: { firstName?: string | null; lastName?: string | null } | null) =>
  p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';

const sectionLabel = (s: { name: string; class: { name: string } }) => `${s.class.name} - ${s.name}`;

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const ORDER: Prisma.TimetableOrderByWithRelationInput[] = [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }];

@Injectable()
export class TimetableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly years: AcademicYearsService,
  ) {}

  async sectionTimetable(tenantId: string, sectionId: string, academicYearId?: string) {
    const [section, year] = await Promise.all([
      this.requireSection(tenantId, sectionId),
      this.resolveYear(tenantId, academicYearId),
    ]);
    const entries = await this.prisma.timetable.findMany({
      where: { tenantId, academicYearId: year.id, sectionId },
      include: ENTRY_INCLUDE,
      orderBy: ORDER,
    });
    return {
      academicYear: { id: year.id, name: year.name },
      section: { id: section.id, label: sectionLabel(section) },
      entries: entries.map((e) => this.serialize(e)),
    };
  }

  async staffTimetable(tenantId: string, staffId: string, academicYearId?: string) {
    const [staff, year] = await Promise.all([
      this.prisma.staff.findFirst({
        where: { id: staffId, tenantId, deletedAt: null },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      }),
      this.resolveYear(tenantId, academicYearId),
    ]);
    if (!staff) throw new NotFoundException('Teacher not found');

    const entries = await this.prisma.timetable.findMany({
      where: { tenantId, academicYearId: year.id, staffId, section: { deletedAt: null } },
      include: ENTRY_INCLUDE,
      orderBy: ORDER,
    });
    return {
      academicYear: { id: year.id, name: year.name },
      staff: { id: staff.id, name: personName(staff.user) },
      periodsPerWeek: entries.length,
      entries: entries.map((e) => this.serialize(e)),
    };
  }

  async upsertEntry(user: AuthUser, dto: UpsertTimetableEntryDto) {
    const tenantId = user.tenantId;
    if (toMinutes(dto.startTime) >= toMinutes(dto.endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const [section, year, subject, staff] = await Promise.all([
      this.requireSection(tenantId, dto.sectionId),
      this.resolveYear(tenantId, dto.academicYearId),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, tenantId, deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.staff.findFirst({
        where: { id: dto.staffId, tenantId, deletedAt: null },
        select: { id: true, status: true, user: { select: { firstName: true, lastName: true } } },
      }),
    ]);
    if (!subject) throw new NotFoundException('Subject not found');
    if (!staff) throw new NotFoundException('Teacher not found');
    const teacherName = personName(staff.user);
    if (staff.status === 'RESIGNED' || staff.status === 'TERMINATED') {
      throw new BadRequestException(`${teacherName} is no longer an active staff member`);
    }

    // The teacher must be free in this slot in every other section.
    const clash = await this.prisma.timetable.findFirst({
      where: {
        tenantId,
        academicYearId: year.id,
        staffId: staff.id,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
        NOT: { sectionId: section.id },
      },
      select: { section: { select: SECTION_SELECT } },
    });
    if (clash) {
      throw new ConflictException(
        `${teacherName} already teaches ${sectionLabel(clash.section)} on ${DAY_NAMES[dto.dayOfWeek]}, period ${dto.periodNumber}`,
      );
    }

    const data = {
      subjectId: subject.id,
      staffId: staff.id,
      startTime: dto.startTime,
      endTime: dto.endTime,
      roomNumber: dto.roomNumber?.trim() || null,
    };
    const entry = await this.prisma.timetable.upsert({
      where: {
        tenantId_academicYearId_sectionId_dayOfWeek_periodNumber: {
          tenantId,
          academicYearId: year.id,
          sectionId: section.id,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
        },
      },
      create: {
        tenantId,
        academicYearId: year.id,
        sectionId: section.id,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
        ...data,
      },
      update: data,
      include: ENTRY_INCLUDE,
    });
    await this.audit.log(user, 'UPSERT', 'Timetable', entry.id, {
      section: sectionLabel(section),
      day: DAY_NAMES[dto.dayOfWeek],
      period: dto.periodNumber,
      subject: subject.name,
      teacher: teacherName,
    });
    return this.serialize(entry);
  }

  async removeEntry(user: AuthUser, id: string) {
    const entry = await this.prisma.timetable.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!entry) throw new NotFoundException('Timetable entry not found');
    await this.prisma.timetable.delete({ where: { id } });
    await this.audit.log(user, 'DELETE', 'Timetable', id, {
      sectionId: entry.sectionId,
      day: DAY_NAMES[entry.dayOfWeek],
      period: entry.periodNumber,
    });
    return { id, deleted: true };
  }

  // Copies periods from one section into another. Periods whose teacher is
  // busy elsewhere in that slot (or already filled in the target, unless
  // replaceExisting) are skipped.
  async copy(user: AuthUser, dto: CopyTimetableDto) {
    const tenantId = user.tenantId;
    const targetYear = await this.resolveYear(tenantId, dto.academicYearId);
    const sourceYear = dto.fromAcademicYearId ? await this.resolveYear(tenantId, dto.fromAcademicYearId) : targetYear;
    if (dto.fromSectionId === dto.toSectionId && sourceYear.id === targetYear.id) {
      throw new BadRequestException('Choose a different section to copy from');
    }
    const [from, to] = await Promise.all([
      this.requireSection(tenantId, dto.fromSectionId),
      this.requireSection(tenantId, dto.toSectionId),
    ]);

    const source = await this.prisma.timetable.findMany({
      where: {
        tenantId,
        academicYearId: sourceYear.id,
        sectionId: from.id,
        subject: { deletedAt: null },
        staff: { deletedAt: null, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      },
      orderBy: ORDER,
    });
    if (!source.length) throw new BadRequestException(`${sectionLabel(from)} has no timetable to copy`);

    const result = await this.prisma.$transaction(
      async (tx) => {
        const [existing, busy] = await Promise.all([
          tx.timetable.findMany({
            where: { tenantId, academicYearId: targetYear.id, sectionId: to.id },
            select: { dayOfWeek: true, periodNumber: true },
          }),
          tx.timetable.findMany({
            where: {
              tenantId,
              academicYearId: targetYear.id,
              staffId: { in: [...new Set(source.map((e) => e.staffId))] },
              NOT: { sectionId: to.id },
            },
            select: { staffId: true, dayOfWeek: true, periodNumber: true },
          }),
        ]);
        const filled = new Set(existing.map((e) => `${e.dayOfWeek}:${e.periodNumber}`));
        const busySlots = new Set(busy.map((b) => `${b.staffId}:${b.dayOfWeek}:${b.periodNumber}`));

        let copied = 0;
        let skippedFilled = 0;
        let skippedClash = 0;
        for (const e of source) {
          const slot = `${e.dayOfWeek}:${e.periodNumber}`;
          if (filled.has(slot) && !dto.replaceExisting) {
            skippedFilled += 1;
            continue;
          }
          if (busySlots.has(`${e.staffId}:${slot}`)) {
            skippedClash += 1;
            continue;
          }
          const data = {
            subjectId: e.subjectId,
            staffId: e.staffId,
            startTime: e.startTime,
            endTime: e.endTime,
            roomNumber: e.roomNumber,
          };
          await tx.timetable.upsert({
            where: {
              tenantId_academicYearId_sectionId_dayOfWeek_periodNumber: {
                tenantId,
                academicYearId: targetYear.id,
                sectionId: to.id,
                dayOfWeek: e.dayOfWeek,
                periodNumber: e.periodNumber,
              },
            },
            create: {
              tenantId,
              academicYearId: targetYear.id,
              sectionId: to.id,
              dayOfWeek: e.dayOfWeek,
              periodNumber: e.periodNumber,
              ...data,
            },
            update: data,
          });
          copied += 1;
        }
        return { copied, skipped: skippedFilled + skippedClash, skippedFilled, skippedClash };
      },
      { timeout: 20_000 },
    );

    await this.audit.log(user, 'COPY', 'Timetable', null, {
      from: sectionLabel(from),
      to: sectionLabel(to),
      ...result,
    });
    return { ...result, from: { id: from.id, label: sectionLabel(from) }, to: { id: to.id, label: sectionLabel(to) } };
  }

  // ---------------------------------------------------------------------------
  private serialize(e: EntryRow) {
    return {
      id: e.id,
      dayOfWeek: e.dayOfWeek,
      periodNumber: e.periodNumber,
      startTime: e.startTime,
      endTime: e.endTime,
      roomNumber: e.roomNumber,
      subject: e.subject,
      staff: { id: e.staff.id, name: personName(e.staff.user) },
      section: { id: e.section.id, label: sectionLabel(e.section) },
    };
  }

  private async resolveYear(tenantId: string, academicYearId?: string) {
    if (!academicYearId) return this.years.requireCurrent(tenantId);
    const year = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId, deletedAt: null } });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  private async requireSection(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId, deletedAt: null, class: { deletedAt: null } },
      select: SECTION_SELECT,
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }
}
