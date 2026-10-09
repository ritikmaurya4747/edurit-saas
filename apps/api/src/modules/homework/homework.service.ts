import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StaffContextService } from '../../common/services/staff-context.service';
import { decimal, toNumber } from '../../common/utils/money';
import { getPagination, paginated } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { AcademicYearsService } from '../academic/academic-years.service';
import { CreateHomeworkDto, HomeworkListQueryDto, UpdateHomeworkDto, UpsertSubmissionDto } from './dto/homework.dto';

const SECTION_SELECT = { id: true, name: true, class: { select: { name: true } } } as const;

const HOMEWORK_INCLUDE = {
  section: { select: SECTION_SELECT },
  subject: { select: { id: true, name: true, code: true } },
  staff: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  _count: { select: { submissions: true } },
} satisfies Prisma.HomeworkInclude;

type HomeworkRow = Prisma.HomeworkGetPayload<{ include: typeof HOMEWORK_INCLUDE }>;

const personName = (p?: { firstName?: string | null; lastName?: string | null } | null) =>
  p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';

const sectionLabel = (s: { name: string; class: { name: string } }) => `${s.class.name} - ${s.name}`;

// UTC offset (ms) of a timezone at a given instant.
function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// 'YYYY-MM-DD' → 23:59:59 of that day in the school timezone; ISO datetimes as-is.
function parseDueDate(value: string, timeZone: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const naive = Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 23, 59, 59);
    return new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`Invalid due date '${value}'`);
  return date;
}

@Injectable()
export class HomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staffContext: StaffContextService,
    private readonly years: AcademicYearsService,
  ) {}

  async list(tenantId: string, query: HomeworkListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const now = new Date();
    const search = query.search?.trim();

    const where: Prisma.HomeworkWhereInput = {
      tenantId,
      deletedAt: null,
      ...(query.sectionId && { sectionId: query.sectionId }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.staffId && { staffId: query.staffId }),
      ...(query.status === 'upcoming' && { dueDate: { gte: now } }),
      ...(query.status === 'past' && { dueDate: { lt: now } }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.homework.findMany({
        where,
        include: HOMEWORK_INCLUDE,
        orderBy: [{ dueDate: query.status === 'upcoming' ? 'asc' : 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.homework.count({ where }),
    ]);

    const ids = items.map((h) => h.id);
    const sectionIds = [...new Set(items.map((h) => h.sectionId))];
    const [graded, strength] = await Promise.all([
      ids.length
        ? this.prisma.homeworkSubmission.groupBy({
            by: ['homeworkId'],
            where: { homeworkId: { in: ids }, gradedAt: { not: null } },
            _count: { _all: true },
          })
        : Promise.resolve([] as { homeworkId: string; _count: { _all: number } }[]),
      this.sectionStrength(tenantId, sectionIds),
    ]);
    const gradedMap = new Map(graded.map((g) => [g.homeworkId, g._count._all]));

    return paginated(
      items.map((h) => ({
        ...this.serialize(h),
        counts: {
          totalStudents: strength.get(h.sectionId) ?? 0,
          submitted: h._count.submissions,
          graded: gradedMap.get(h.id) ?? 0,
        },
      })),
      total,
      page,
      limit,
    );
  }

  async get(tenantId: string, id: string) {
    const homework = await this.prisma.homework.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        ...HOMEWORK_INCLUDE,
        submissions: {
          select: { id: true, studentId: true, content: true, submittedAt: true, marks: true, feedback: true, gradedAt: true },
        },
      },
    });
    if (!homework) throw new NotFoundException('Homework not found');

    const year = await this.years.current(tenantId);
    const enrollments = year
      ? await this.prisma.studentEnrollment.findMany({
          where: {
            tenantId,
            academicYearId: year.id,
            sectionId: homework.sectionId,
            student: { deletedAt: null, status: 'ACTIVE' },
          },
          select: {
            rollNumber: true,
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
          },
        })
      : [];

    const submissions = new Map(homework.submissions.map((s) => [s.studentId, s]));
    const roster = enrollments
      .map((e) => {
        const s = submissions.get(e.student.id);
        return {
          studentId: e.student.id,
          name: personName(e.student),
          admissionNumber: e.student.admissionNumber,
          rollNumber: e.rollNumber,
          submission: s
            ? { id: s.id, content: s.content, submittedAt: s.submittedAt, marks: s.marks, feedback: s.feedback, gradedAt: s.gradedAt }
            : null,
        };
      })
      .sort((a, b) => {
        const ra = a.rollNumber ?? Number.MAX_SAFE_INTEGER;
        const rb = b.rollNumber ?? Number.MAX_SAFE_INTEGER;
        return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
      });

    return {
      ...this.serialize(homework),
      counts: {
        totalStudents: roster.length,
        submitted: homework.submissions.length,
        graded: homework.submissions.filter((s) => s.gradedAt).length,
      },
      roster,
    };
  }

  async create(user: AuthUser, dto: CreateHomeworkDto) {
    const tenantId = user.tenantId;
    await Promise.all([this.requireSection(tenantId, dto.sectionId), this.requireSubject(tenantId, dto.subjectId)]);
    const staffId = await this.resolveTeacher(user, dto.staffId);
    const dueDate = parseDueDate(dto.dueDate, await this.timezone(tenantId));

    const homework = await this.prisma.homework.create({
      data: {
        tenantId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        staffId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        dueDate,
        maxMarks: dto.maxMarks != null ? decimal(dto.maxMarks) : null,
      },
    });
    await this.audit.log(user, 'CREATE', 'Homework', homework.id, { title: homework.title, sectionId: dto.sectionId });
    return this.get(tenantId, homework.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateHomeworkDto) {
    const tenantId = user.tenantId;
    const existing = await this.findOrThrow(tenantId, id);

    if (dto.sectionId && dto.sectionId !== existing.sectionId) {
      await this.requireSection(tenantId, dto.sectionId);
      const submissions = await this.prisma.homeworkSubmission.count({ where: { homeworkId: id } });
      if (submissions > 0) {
        throw new BadRequestException('Homework with recorded submissions cannot be moved to another section');
      }
    }
    if (dto.subjectId && dto.subjectId !== existing.subjectId) await this.requireSubject(tenantId, dto.subjectId);
    if (dto.maxMarks != null) {
      const above = await this.prisma.homeworkSubmission.count({
        where: { homeworkId: id, marks: { gt: decimal(dto.maxMarks) } },
      });
      if (above > 0) {
        throw new BadRequestException(`${above} submission(s) already have marks above ${dto.maxMarks}. Adjust them first.`);
      }
    }
    // Only admins can re-assign the teacher; others keep the original.
    const staffId =
      dto.staffId && (user.isAdmin || !user.staffId) ? await this.resolveTeacher(user, dto.staffId) : undefined;
    const dueDate = dto.dueDate ? parseDueDate(dto.dueDate, await this.timezone(tenantId)) : undefined;

    await this.prisma.homework.update({
      where: { id },
      data: {
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        staffId,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        dueDate,
        ...(dto.maxMarks !== undefined && { maxMarks: dto.maxMarks === null ? null : decimal(dto.maxMarks) }),
      },
    });
    await this.audit.log(user, 'UPDATE', 'Homework', id, { ...dto });
    return this.get(tenantId, id);
  }

  async remove(user: AuthUser, id: string) {
    const homework = await this.findOrThrow(user.tenantId, id);
    await this.prisma.homework.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'Homework', id, { title: homework.title });
    return { id, deleted: true };
  }

  async upsertSubmission(user: AuthUser, id: string, studentId: string, dto: UpsertSubmissionDto) {
    const tenantId = user.tenantId;
    const homework = await this.findOrThrow(tenantId, id);

    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        deletedAt: null,
        enrollments: { some: { sectionId: homework.sectionId, academicYear: { isCurrent: true, deletedAt: null } } },
      },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException('Student is not enrolled in the section this homework was assigned to');

    if (!dto.submitted) {
      const { count } = await this.prisma.homeworkSubmission.deleteMany({ where: { homeworkId: id, studentId } });
      if (count) await this.audit.log(user, 'DELETE', 'HomeworkSubmission', id, { studentId });
      return { homeworkId: id, studentId, submission: null };
    }

    if (dto.marks != null && homework.maxMarks != null && dto.marks > toNumber(homework.maxMarks)) {
      throw new BadRequestException(`Marks cannot be more than the maximum of ${toNumber(homework.maxMarks)}`);
    }

    const gradeFields: Prisma.HomeworkSubmissionUpdateInput = {};
    if (dto.marks !== undefined) {
      gradeFields.marks = dto.marks === null ? null : decimal(dto.marks);
      gradeFields.gradedAt = dto.marks === null ? null : new Date();
    }
    if (dto.feedback !== undefined) gradeFields.feedback = dto.feedback?.trim() || null;

    const submission = await this.prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId: id, studentId } },
      create: {
        homeworkId: id,
        studentId,
        content: dto.content?.trim() || null,
        marks: dto.marks != null ? decimal(dto.marks) : null,
        gradedAt: dto.marks != null ? new Date() : null,
        feedback: dto.feedback?.trim() || null,
      },
      update: {
        ...(dto.content !== undefined && { content: dto.content?.trim() || null }),
        ...gradeFields,
      },
      select: { id: true, content: true, submittedAt: true, marks: true, feedback: true, gradedAt: true },
    });
    await this.audit.log(user, 'UPDATE', 'HomeworkSubmission', submission.id, {
      homeworkId: id,
      studentId,
      marks: dto.marks,
    });
    return { homeworkId: id, studentId, submission };
  }

  // ---------------------------------------------------------------------------
  private serialize(h: HomeworkRow) {
    return {
      id: h.id,
      title: h.title,
      description: h.description,
      dueDate: h.dueDate,
      maxMarks: h.maxMarks,
      createdAt: h.createdAt,
      section: { id: h.section.id, label: sectionLabel(h.section) },
      subject: { id: h.subject.id, name: h.subject.name, code: h.subject.code },
      staff: { id: h.staff.id, name: personName(h.staff.user) },
    };
  }

  // Active current-year students per section.
  private async sectionStrength(tenantId: string, sectionIds: string[]) {
    const map = new Map<string, number>();
    if (!sectionIds.length) return map;
    const year = await this.years.current(tenantId);
    if (!year) return map;
    const counts = await this.prisma.studentEnrollment.groupBy({
      by: ['sectionId'],
      where: {
        tenantId,
        academicYearId: year.id,
        sectionId: { in: sectionIds },
        student: { deletedAt: null, status: 'ACTIVE' },
      },
      _count: { _all: true },
    });
    counts.forEach((c) => map.set(c.sectionId, c._count._all));
    return map;
  }

  // Admins (or users without a staff profile) may assign on behalf of a
  // teacher; everyone else is recorded as the assigning teacher themself.
  private async resolveTeacher(user: AuthUser, staffId?: string) {
    if (staffId && (user.isAdmin || !user.staffId)) {
      const staff = await this.prisma.staff.findFirst({
        where: { id: staffId, tenantId: user.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!staff) throw new NotFoundException('Teacher not found');
      return staff.id;
    }
    return this.staffContext.resolveStaffId(user);
  }

  private async requireSection(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId, deletedAt: null, class: { deletedAt: null } },
      select: { id: true },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  private async requireSubject(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, tenantId, deletedAt: null }, select: { id: true } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  private async findOrThrow(tenantId: string, id: string) {
    const homework = await this.prisma.homework.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!homework) throw new NotFoundException('Homework not found');
    return homework;
  }

  private async timezone(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return settings?.timezone || 'Asia/Kolkata';
  }
}
