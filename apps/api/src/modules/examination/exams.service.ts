import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { toNumber } from '../../common/utils/money';
import type { AuthUser } from '../../common/types/auth-user';
import { AcademicYearsService } from '../academic/academic-years.service';
import {
  CreateExamDto,
  CreateExamSubjectDto,
  UpdateExamDto,
  UpdateExamSubjectDto,
} from './dto/examination.dto';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly years: AcademicYearsService,
  ) {}

  // ---------- Exams ----------
  async list(tenantId: string, academicYearId?: string) {
    const yearId = academicYearId ?? (await this.years.current(tenantId))?.id;
    if (!yearId) return [];

    const exams = await this.prisma.exam.findMany({
      where: { tenantId, academicYearId: yearId, deletedAt: null },
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
      include: {
        academicYear: { select: { id: true, name: true } },
        examSubjects: { select: { _count: { select: { examMarks: true } } } },
      },
    });

    return exams.map(({ examSubjects, ...exam }) => ({
      ...exam,
      subjectCount: examSubjects.length,
      marksEntered: examSubjects.reduce((sum, s) => sum + s._count.examMarks, 0),
    }));
  }

  async get(tenantId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        academicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
        examSubjects: {
          orderBy: [{ examDate: 'asc' }],
          include: {
            subject: { select: { id: true, name: true, code: true } },
            _count: { select: { examMarks: true } },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const { examSubjects, ...rest } = exam;
    return {
      ...rest,
      examSubjects: examSubjects
        .sort((a, b) => a.examDate.getTime() - b.examDate.getTime() || a.subject.name.localeCompare(b.subject.name))
        .map(({ _count, ...s }) => ({
          id: s.id,
          subjectId: s.subjectId,
          subject: s.subject,
          examDate: s.examDate,
          maxMarks: s.maxMarks,
          passingMarks: s.passingMarks,
          paperPdfUrl: s.paperPdfUrl,
          marksCount: _count.examMarks,
        })),
    };
  }

  async create(user: AuthUser, dto: CreateExamDto) {
    const year = dto.academicYearId
      ? await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, tenantId: user.tenantId, deletedAt: null } })
      : await this.years.requireCurrent(user.tenantId);
    if (!year) throw new NotFoundException('Academic year not found');

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    this.assertRange(startDate, endDate, year);

    const exam = await this.prisma.exam.create({
      data: { tenantId: user.tenantId, academicYearId: year.id, name: dto.name.trim(), startDate, endDate },
    });
    await this.audit.log(user, 'CREATE', 'Exam', exam.id, { name: exam.name, academicYear: year.name });
    return exam;
  }

  async update(user: AuthUser, id: string, dto: UpdateExamDto) {
    const exam = await this.findExamOrThrow(user.tenantId, id);
    const year = await this.prisma.academicYear.findFirst({ where: { id: exam.academicYearId, tenantId: user.tenantId } });
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : exam.startDate;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : exam.endDate;
    this.assertRange(startDate, endDate, year);

    const outside = await this.prisma.examSubject.count({
      where: { examId: id, exam: { tenantId: user.tenantId }, OR: [{ examDate: { lt: startDate } }, { examDate: { gt: endDate } }] },
    });
    if (outside > 0) {
      throw new BadRequestException(
        `${outside} scheduled paper(s) fall outside the new dates. Reschedule them first.`,
      );
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: { name: dto.name?.trim(), startDate, endDate },
    });
    await this.audit.log(user, 'UPDATE', 'Exam', id, { ...dto });
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const exam = await this.findExamOrThrow(user.tenantId, id);
    const marks = await this.prisma.examMark.count({ where: { examSubject: { examId: id, exam: { tenantId: user.tenantId } } } });
    if (marks > 0) {
      throw new BadRequestException(`This exam already has ${marks} mark(s) entered and cannot be deleted`);
    }
    await this.prisma.exam.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'Exam', id, { name: exam.name });
    return { id, deleted: true };
  }

  async publish(user: AuthUser, id: string, isPublished: boolean) {
    const exam = await this.findExamOrThrow(user.tenantId, id);
    if (isPublished) {
      const subjects = await this.prisma.examSubject.count({ where: { examId: id, exam: { tenantId: user.tenantId } } });
      if (subjects === 0) throw new BadRequestException('Add at least one subject to the schedule before publishing');
    }
    const updated = await this.prisma.exam.update({ where: { id }, data: { isPublished } });
    await this.audit.log(user, isPublished ? 'PUBLISH' : 'UNPUBLISH', 'Exam', id, { name: exam.name });
    return updated;
  }

  // ---------- Schedule (exam subjects) ----------
  async addSubject(user: AuthUser, examId: string, dto: CreateExamSubjectDto) {
    const exam = await this.findExamOrThrow(user.tenantId, examId);
    const subject = await this.findSubjectOrThrow(user.tenantId, dto.subjectId);
    const examDate = parseDateOnly(dto.examDate);
    this.assertInExam(examDate, exam);
    const maxMarks = dto.maxMarks ?? 100;
    const passingMarks = dto.passingMarks ?? 33;
    this.assertMarksConfig(maxMarks, passingMarks);

    const duplicate = await this.prisma.examSubject.findFirst({ where: { examId, subjectId: subject.id } });
    if (duplicate) throw new ConflictException(`${subject.name} is already scheduled in ${exam.name}`);

    const created = await this.prisma.examSubject.create({
      data: { examId, subjectId: subject.id, examDate, maxMarks, passingMarks, paperPdfUrl: dto.paperPdfUrl || null },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });
    await this.audit.log(user, 'CREATE', 'ExamSubject', created.id, {
      exam: exam.name,
      subject: subject.name,
      examDate: dto.examDate,
    });
    return created;
  }

  async updateSubject(user: AuthUser, id: string, dto: UpdateExamSubjectDto) {
    const examSubject = await this.findExamSubjectOrThrow(user.tenantId, id);
    const { exam } = examSubject;

    let subjectId = examSubject.subjectId;
    if (dto.subjectId && dto.subjectId !== examSubject.subjectId) {
      const subject = await this.findSubjectOrThrow(user.tenantId, dto.subjectId);
      const duplicate = await this.prisma.examSubject.findFirst({ where: { examId: exam.id, subjectId: subject.id } });
      if (duplicate) throw new ConflictException(`${subject.name} is already scheduled in ${exam.name}`);
      if (examSubject._count.examMarks > 0) {
        throw new BadRequestException('Marks are already entered for this paper; the subject cannot be changed');
      }
      subjectId = subject.id;
    }

    const examDate = dto.examDate ? parseDateOnly(dto.examDate) : examSubject.examDate;
    this.assertInExam(examDate, exam);

    const maxMarks = dto.maxMarks ?? toNumber(examSubject.maxMarks);
    const passingMarks = dto.passingMarks ?? toNumber(examSubject.passingMarks);
    this.assertMarksConfig(maxMarks, passingMarks);

    const marksChanged =
      maxMarks !== toNumber(examSubject.maxMarks) || passingMarks !== toNumber(examSubject.passingMarks);
    if (marksChanged && exam.isPublished) {
      throw new BadRequestException('Unpublish the exam to change maximum or passing marks');
    }
    if (maxMarks < toNumber(examSubject.maxMarks)) {
      const above = await this.prisma.examMark.count({ where: { examSubjectId: id, marksObtained: { gt: maxMarks } } });
      if (above > 0) {
        throw new BadRequestException(`${above} student(s) already have marks above ${maxMarks}. Correct those marks first.`);
      }
    }

    const updated = await this.prisma.examSubject.update({
      where: { id },
      data: {
        subjectId,
        examDate,
        maxMarks,
        passingMarks,
        ...(dto.paperPdfUrl !== undefined && { paperPdfUrl: dto.paperPdfUrl || null }),
      },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });
    await this.audit.log(user, 'UPDATE', 'ExamSubject', id, { ...dto });
    return updated;
  }

  async removeSubject(user: AuthUser, id: string) {
    const examSubject = await this.findExamSubjectOrThrow(user.tenantId, id);
    if (examSubject._count.examMarks > 0) {
      throw new BadRequestException(
        `${examSubject._count.examMarks} mark(s) are entered for ${examSubject.subject.name}. Clear them before removing the paper.`,
      );
    }
    await this.prisma.examSubject.delete({ where: { id } });
    await this.audit.log(user, 'DELETE', 'ExamSubject', id, {
      exam: examSubject.exam.name,
      subject: examSubject.subject.name,
    });
    return { id, deleted: true };
  }

  // ---------- Shared helpers (used by marks, report cards and seating) ----------
  async findExamOrThrow(tenantId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async findExamSubjectOrThrow(tenantId: string, id: string) {
    const examSubject = await this.prisma.examSubject.findFirst({
      where: { id, exam: { tenantId, deletedAt: null } },
      include: {
        exam: true,
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { examMarks: true } },
      },
    });
    if (!examSubject) throw new NotFoundException('Exam paper not found');
    return examSubject;
  }

  async findSectionOrThrow(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { class: { select: { id: true, name: true } } },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  private async findSubjectOrThrow(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  private assertRange(startDate: Date, endDate: Date, year?: { name: string; startDate: Date; endDate: Date } | null) {
    if (endDate < startDate) throw new BadRequestException('End date cannot be before the start date');
    if (year && (startDate < year.startDate || endDate > year.endDate)) {
      throw new BadRequestException(
        `Exam dates must fall within academic year ${year.name} (${formatDateOnly(year.startDate)} to ${formatDateOnly(year.endDate)})`,
      );
    }
  }

  private assertInExam(examDate: Date, exam: { name: string; startDate: Date; endDate: Date }) {
    if (examDate < exam.startDate || examDate > exam.endDate) {
      throw new BadRequestException(
        `Paper date must be between ${formatDateOnly(exam.startDate)} and ${formatDateOnly(exam.endDate)} (${exam.name})`,
      );
    }
  }

  private assertMarksConfig(maxMarks: number, passingMarks: number) {
    if (passingMarks > maxMarks) throw new BadRequestException('Passing marks cannot be more than maximum marks');
  }
}
