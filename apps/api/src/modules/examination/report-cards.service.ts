import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { round2, toNumber } from '../../common/utils/money';
import type { AuthUser } from '../../common/types/auth-user';
import { ExamsService } from './exams.service';
import { MarksService, type ResultRow } from './marks.service';
import { autoRemark, gradeFor, isAutoRemark, percentOf } from './grading';
import { GenerateReportCardsDto, ReportCardListQueryDto, UpdateReportCardDto } from './dto/examination.dto';

@Injectable()
export class ReportCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly exams: ExamsService,
    private readonly marks: MarksService,
  ) {}

  // Computes overall percent/grade for every student with at least one mark
  // and upserts their report card. Teacher-written remarks are preserved.
  async generate(user: AuthUser, examId: string, dto: GenerateReportCardsDto) {
    const exam = await this.exams.findExamOrThrow(user.tenantId, examId);
    if (dto.sectionId) await this.exams.findSectionOrThrow(user.tenantId, dto.sectionId);

    const { sections } = await this.marks.computeExamResults(user.tenantId, exam, dto.sectionId);
    const rows: ResultRow[] = [...sections.values()].flatMap((s) => s.students).filter((r) => r.percent != null);
    if (!rows.length) {
      throw new BadRequestException('No marks have been entered for this exam yet, so there is nothing to generate');
    }

    const existing = await this.prisma.reportCard.findMany({
      where: { tenantId: user.tenantId, examId, studentId: { in: rows.map((r) => r.studentId) } },
      select: { studentId: true, remarks: true },
    });
    const existingRemarks = new Map(existing.map((r) => [r.studentId, r.remarks]));
    const now = new Date();

    await this.prisma.$transaction(
      async (tx) => {
        for (const row of rows) {
          const current = existingRemarks.get(row.studentId);
          const remarks = isAutoRemark(current) ? autoRemark(row.grade) : current;
          await tx.reportCard.upsert({
            where: { examId_studentId: { examId, studentId: row.studentId } },
            create: {
              tenantId: user.tenantId,
              examId,
              studentId: row.studentId,
              overallPercent: row.percent!,
              grade: row.grade!,
              remarks,
              generatedAt: now,
            },
            update: { overallPercent: row.percent!, grade: row.grade!, remarks, generatedAt: now },
          });
        }
        await this.audit.log(
          user,
          'GENERATE',
          'ReportCard',
          null,
          { exam: exam.name, sectionId: dto.sectionId ?? 'ALL', generated: rows.length },
          tx,
        );
      },
      { timeout: 60_000 },
    );

    return { generated: rows.length };
  }

  async list(tenantId: string, query: ReportCardListQueryDto) {
    const exam = await this.exams.findExamOrThrow(tenantId, query.examId);
    if (query.sectionId) await this.exams.findSectionOrThrow(tenantId, query.sectionId);

    const { sections } = await this.marks.computeExamResults(tenantId, exam, query.sectionId);
    const rows = new Map<string, ResultRow>();
    for (const s of sections.values()) for (const r of s.students) rows.set(r.studentId, r);

    const cards = await this.prisma.reportCard.findMany({
      where: { tenantId, examId: exam.id, studentId: { in: [...rows.keys()] } },
      orderBy: { generatedAt: 'desc' },
    });

    return cards
      .map((card) => {
        const row = rows.get(card.studentId)!;
        return {
          id: card.id,
          studentId: card.studentId,
          name: row.name,
          admissionNumber: row.admissionNumber,
          rollNumber: row.rollNumber,
          sectionId: row.sectionId,
          sectionLabel: row.sectionLabel,
          overallPercent: card.overallPercent,
          grade: card.grade,
          rank: row.rank,
          result: row.result,
          remarks: card.remarks,
          generatedAt: card.generatedAt,
        };
      })
      .sort(
        (a, b) =>
          a.sectionLabel.localeCompare(b.sectionLabel, undefined, { numeric: true }) ||
          (a.rollNumber ?? Number.MAX_SAFE_INTEGER) - (b.rollNumber ?? Number.MAX_SAFE_INTEGER) ||
          a.name.localeCompare(b.name),
      );
  }

  // Full report card. Computed live from marks so it works before generation;
  // includes reportCardId/remarks when a card has been generated.
  async studentCard(tenantId: string, studentId: string, examId: string) {
    const exam = await this.exams.findExamOrThrow(tenantId, examId);
    const year = await this.prisma.academicYear.findFirst({ where: { id: exam.academicYearId, tenantId } });

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      include: {
        guardians: {
          orderBy: { isPrimary: 'desc' },
          include: { parent: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { tenantId, studentId, academicYearId: exam.academicYearId },
      include: { section: { select: { id: true, name: true, class: { select: { name: true } } } } },
    });
    if (!enrollment) {
      throw new NotFoundException(`This student was not enrolled in academic year ${year?.name ?? ''} of this exam`.trim());
    }

    const { papers, sections, markMap } = await this.marks.computeExamResults(tenantId, exam, enrollment.sectionId);
    const section = sections.get(enrollment.sectionId);
    const row = section?.students.find((r) => r.studentId === studentId);
    const studentMarks = markMap.get(studentId);

    const [tenant, reportCard, attendance] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, settings: { select: { logoUrl: true } } } }),
      this.prisma.reportCard.findFirst({ where: { tenantId, examId: exam.id, studentId } }),
      this.attendance(tenantId, studentId, year?.startDate, year?.endDate),
    ]);

    const guardian = student.guardians.find((g) => g.parent.deletedAt == null) ?? null;

    return {
      reportCardId: reportCard?.id ?? null,
      school: { name: tenant?.name ?? '', logoUrl: tenant?.settings?.logoUrl ?? null },
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNumber: student.admissionNumber,
        dob: student.dob,
        rollNumber: enrollment.rollNumber,
        className: enrollment.section.class.name,
        sectionName: enrollment.section.name,
        sectionId: enrollment.sectionId,
        guardianName: guardian ? `${guardian.parent.user.firstName} ${guardian.parent.user.lastName}`.trim() : null,
        guardianRelationship: guardian?.relationship ?? null,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        startDate: exam.startDate,
        endDate: exam.endDate,
        isPublished: exam.isPublished,
        academicYear: year?.name ?? null,
      },
      subjects: papers.map((p) => {
        const cell = studentMarks?.get(p.examSubjectId);
        const percent = cell ? percentOf(cell.marksObtained, p.maxMarks) : null;
        return {
          examSubjectId: p.examSubjectId,
          name: p.subjectName,
          code: p.subjectCode,
          maxMarks: p.maxMarks,
          passingMarks: p.passingMarks,
          marksObtained: cell ? cell.marksObtained : null,
          percent,
          grade: gradeFor(percent),
          passed: cell ? cell.marksObtained >= p.passingMarks : null,
          remarks: cell?.remarks ?? null,
        };
      }),
      totals: {
        obtained: row?.total ?? 0,
        max: row?.maxTotal ?? 0,
        percent: row?.percent ?? null,
        grade: row?.grade ?? null,
        result: row?.result ?? null,
        rank: row?.rank ?? null,
        classSize: section?.sectionStats.appeared ?? 0,
      },
      attendance,
      remarks: reportCard ? reportCard.remarks : autoRemark(row?.grade ?? null),
      overallPercent: reportCard ? toNumber(reportCard.overallPercent) : null,
      generatedAt: reportCard?.generatedAt ?? null,
    };
  }

  async updateRemarks(user: AuthUser, id: string, dto: UpdateReportCardDto) {
    const card = await this.prisma.reportCard.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!card) throw new NotFoundException('Report card not found. Generate report cards first.');
    const updated = await this.prisma.reportCard.update({
      where: { id },
      data: { remarks: dto.remarks?.trim() || null },
    });
    await this.audit.log(user, 'UPDATE', 'ReportCard', id, { remarks: updated.remarks });
    return updated;
  }

  // Attendance for the academic year. One status per day: the daily
  // (lowest period number) record wins when period-wise attendance exists.
  private async attendance(tenantId: string, studentId: string, from?: Date, to?: Date) {
    if (!from || !to) return { present: 0, total: 0, percent: null as number | null };
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId, session: { tenantId, attendanceDate: { gte: from, lte: to } } },
      select: { status: true, session: { select: { attendanceDate: true, periodNumber: true } } },
    });
    const days = new Map<string, { period: number; status: string }>();
    for (const r of records) {
      const key = r.session.attendanceDate.toISOString().slice(0, 10);
      const existing = days.get(key);
      if (!existing || r.session.periodNumber < existing.period) {
        days.set(key, { period: r.session.periodNumber, status: r.status });
      }
    }
    const total = days.size;
    const present = [...days.values()].filter((d) => d.status === 'PRESENT' || d.status === 'LATE').length;
    return { present, total, percent: total ? round2((present / total) * 100) : null };
  }
}
