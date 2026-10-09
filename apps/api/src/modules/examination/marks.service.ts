import { BadRequestException, Injectable } from '@nestjs/common';
import type { Exam } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { round2, toNumber } from '../../common/utils/money';
import type { AuthUser } from '../../common/types/auth-user';
import { ExamsService } from './exams.service';
import { gradeFor, percentOf } from './grading';
import { SaveMarksDto } from './dto/examination.dto';

export interface Paper {
  examSubjectId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examDate: Date;
  maxMarks: number;
  passingMarks: number;
}

export interface MarkCell {
  marksObtained: number;
  remarks: string | null;
}

export interface ResultRow {
  studentId: string;
  name: string;
  admissionNumber: string;
  rollNumber: number | null;
  sectionId: string;
  sectionLabel: string;
  marks: Record<string, number | null>;
  total: number;
  maxTotal: number;
  percent: number | null;
  grade: string | null;
  result: 'PASS' | 'FAIL' | null;
  rank: number | null;
}

export interface SectionResults {
  sectionId: string;
  sectionLabel: string;
  students: ResultRow[];
  sectionStats: {
    students: number;
    appeared: number;
    passed: number;
    average: number | null;
    highest: number | null;
    passPercent: number | null;
  };
}

const studentName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim();

const byRollThenName = (
  a: { rollNumber: number | null; name: string },
  b: { rollNumber: number | null; name: string },
) => (a.rollNumber ?? Number.MAX_SAFE_INTEGER) - (b.rollNumber ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name);

@Injectable()
export class MarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly exams: ExamsService,
  ) {}

  // ---------- Marks entry ----------
  async getMarks(tenantId: string, examSubjectId: string, sectionId: string) {
    const examSubject = await this.exams.findExamSubjectOrThrow(tenantId, examSubjectId);
    const section = await this.exams.findSectionOrThrow(tenantId, sectionId);
    const roster = await this.roster(tenantId, examSubject.exam.academicYearId, sectionId);

    const marks = await this.prisma.examMark.findMany({
      where: {
        examSubjectId,
        examSubject: { exam: { tenantId } },
        studentId: { in: roster.map((r) => r.studentId) },
      },
    });
    const byStudent = new Map(marks.map((m) => [m.studentId, m]));

    return {
      examSubject: {
        id: examSubject.id,
        subject: examSubject.subject,
        examDate: examSubject.examDate,
        maxMarks: examSubject.maxMarks,
        passingMarks: examSubject.passingMarks,
      },
      exam: { id: examSubject.exam.id, name: examSubject.exam.name, isPublished: examSubject.exam.isPublished },
      section: { id: section.id, label: `${section.class.name} - ${section.name}` },
      students: roster.map((r) => {
        const mark = byStudent.get(r.studentId);
        return {
          studentId: r.studentId,
          name: r.name,
          rollNumber: r.rollNumber,
          admissionNumber: r.admissionNumber,
          marksObtained: mark ? toNumber(mark.marksObtained) : null,
          remarks: mark?.remarks ?? null,
        };
      }),
    };
  }

  async saveMarks(user: AuthUser, examSubjectId: string, dto: SaveMarksDto) {
    const examSubject = await this.exams.findExamSubjectOrThrow(user.tenantId, examSubjectId);
    if (examSubject.exam.isPublished) {
      throw new BadRequestException('Results for this exam are published. Unpublish the exam to edit marks.');
    }
    await this.exams.findSectionOrThrow(user.tenantId, dto.sectionId);
    const roster = await this.roster(user.tenantId, examSubject.exam.academicYearId, dto.sectionId);
    const rosterById = new Map(roster.map((r) => [r.studentId, r]));
    const maxMarks = toNumber(examSubject.maxMarks);

    const seen = new Set<string>();
    for (const entry of dto.marks) {
      const student = rosterById.get(entry.studentId);
      if (!student) throw new BadRequestException('Some students in the list are not enrolled in this section');
      if (seen.has(entry.studentId)) throw new BadRequestException(`${student.name} appears more than once in the list`);
      seen.add(entry.studentId);
      if (entry.marksObtained != null && (entry.marksObtained < 0 || entry.marksObtained > maxMarks)) {
        throw new BadRequestException(`Marks for ${student.name} must be between 0 and ${maxMarks}`);
      }
    }

    const toClear = dto.marks.filter((m) => m.marksObtained == null).map((m) => m.studentId);
    const toSave = dto.marks.filter((m) => m.marksObtained != null);

    const cleared = await this.prisma.$transaction(
      async (tx) => {
        const removed = toClear.length
          ? await tx.examMark.deleteMany({ where: { examSubjectId, studentId: { in: toClear } } })
          : { count: 0 };
        for (const entry of toSave) {
          const remarks = entry.remarks?.trim() || null;
          await tx.examMark.upsert({
            where: { examSubjectId_studentId: { examSubjectId, studentId: entry.studentId } },
            create: { examSubjectId, studentId: entry.studentId, marksObtained: entry.marksObtained, remarks },
            update: { marksObtained: entry.marksObtained, remarks },
          });
        }
        await this.audit.log(
          user,
          'MARKS_ENTRY',
          'ExamSubject',
          examSubjectId,
          { exam: examSubject.exam.name, subject: examSubject.subject.name, sectionId: dto.sectionId, saved: toSave.length, cleared: toClear.length },
          tx,
        );
        return removed.count;
      },
      { timeout: 30_000 },
    );

    return { saved: toSave.length, cleared, total: dto.marks.length };
  }

  // ---------- Results ----------
  async sectionResults(tenantId: string, examId: string, sectionId: string) {
    const exam = await this.exams.findExamOrThrow(tenantId, examId);
    const section = await this.exams.findSectionOrThrow(tenantId, sectionId);
    const { papers, sections } = await this.computeExamResults(tenantId, exam, sectionId);
    const result = sections.get(sectionId);

    return {
      exam: { id: exam.id, name: exam.name, isPublished: exam.isPublished },
      section: { id: section.id, label: `${section.class.name} - ${section.name}` },
      subjects: papers.map((p) => ({
        examSubjectId: p.examSubjectId,
        subjectName: p.subjectName,
        subjectCode: p.subjectCode,
        maxMarks: p.maxMarks,
        passingMarks: p.passingMarks,
      })),
      students: result?.students ?? [],
      sectionStats: result?.sectionStats ?? this.stats([]),
    };
  }

  // Computes results for every enrolled student of the exam's academic year
  // (optionally one section). Ranks are within a section.
  async computeExamResults(tenantId: string, exam: Exam, sectionId?: string) {
    const examSubjects = await this.prisma.examSubject.findMany({
      where: { examId: exam.id, exam: { tenantId } },
      include: { subject: { select: { id: true, name: true, code: true } } },
      orderBy: { examDate: 'asc' },
    });
    const papers: Paper[] = examSubjects
      .map((s) => ({
        examSubjectId: s.id,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        subjectCode: s.subject.code,
        examDate: s.examDate,
        maxMarks: toNumber(s.maxMarks),
        passingMarks: toNumber(s.passingMarks),
      }))
      .sort((a, b) => a.examDate.getTime() - b.examDate.getTime() || a.subjectName.localeCompare(b.subjectName));

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId,
        academicYearId: exam.academicYearId,
        ...(sectionId && { sectionId }),
        student: { deletedAt: null },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        section: { select: { id: true, name: true, class: { select: { name: true } } } },
      },
    });

    const marks = await this.prisma.examMark.findMany({
      where: {
        examSubject: { examId: exam.id, exam: { tenantId } },
        ...(sectionId && { studentId: { in: enrollments.map((e) => e.studentId) } }),
      },
      select: { examSubjectId: true, studentId: true, marksObtained: true, remarks: true },
    });
    const markMap = new Map<string, Map<string, MarkCell>>();
    for (const m of marks) {
      if (!markMap.has(m.studentId)) markMap.set(m.studentId, new Map());
      markMap.get(m.studentId)!.set(m.examSubjectId, { marksObtained: toNumber(m.marksObtained), remarks: m.remarks });
    }

    const grouped = new Map<string, ResultRow[]>();
    const labels = new Map<string, string>();
    for (const e of enrollments) {
      const label = `${e.section.class.name} - ${e.section.name}`;
      labels.set(e.sectionId, label);
      const studentMarks = markMap.get(e.studentId) ?? new Map<string, MarkCell>();
      const row: ResultRow = {
        studentId: e.studentId,
        name: studentName(e.student),
        admissionNumber: e.student.admissionNumber,
        rollNumber: e.rollNumber,
        sectionId: e.sectionId,
        sectionLabel: label,
        marks: {},
        total: 0,
        maxTotal: 0,
        percent: null,
        grade: null,
        result: null,
        rank: null,
      };
      let failed = false;
      for (const paper of papers) {
        const cell = studentMarks.get(paper.examSubjectId);
        row.marks[paper.examSubjectId] = cell ? cell.marksObtained : null;
        if (!cell) continue;
        row.total += cell.marksObtained;
        row.maxTotal += paper.maxMarks;
        if (cell.marksObtained < paper.passingMarks) failed = true;
      }
      row.total = round2(row.total);
      row.maxTotal = round2(row.maxTotal);
      if (row.maxTotal > 0) {
        row.percent = percentOf(row.total, row.maxTotal);
        row.grade = gradeFor(row.percent);
        row.result = failed ? 'FAIL' : 'PASS';
      }
      if (!grouped.has(e.sectionId)) grouped.set(e.sectionId, []);
      grouped.get(e.sectionId)!.push(row);
    }

    const sections = new Map<string, SectionResults>();
    for (const [id, rows] of grouped) {
      this.rank(rows);
      rows.sort(byRollThenName);
      sections.set(id, { sectionId: id, sectionLabel: labels.get(id)!, students: rows, sectionStats: this.stats(rows) });
    }

    return { papers, sections, markMap };
  }

  // Students of a section for the given academic year, ordered by roll number.
  async roster(tenantId: string, academicYearId: string, sectionId: string) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenantId, academicYearId, sectionId, student: { deletedAt: null } },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
    });
    return enrollments
      .map((e) => ({
        studentId: e.studentId,
        name: studentName(e.student),
        admissionNumber: e.student.admissionNumber,
        rollNumber: e.rollNumber,
      }))
      .sort(byRollThenName);
  }

  // Competition ranking ("1, 1, 3") by percent, highest first.
  private rank(rows: ResultRow[]) {
    const ranked = rows.filter((r) => r.percent != null).sort((a, b) => b.percent! - a.percent!);
    ranked.forEach((row, index) => {
      row.rank = index > 0 && ranked[index - 1].percent === row.percent ? ranked[index - 1].rank : index + 1;
    });
  }

  private stats(rows: ResultRow[]): SectionResults['sectionStats'] {
    const appeared = rows.filter((r) => r.percent != null);
    const passed = appeared.filter((r) => r.result === 'PASS').length;
    return {
      students: rows.length,
      appeared: appeared.length,
      passed,
      average: appeared.length ? round2(appeared.reduce((s, r) => s + r.percent!, 0) / appeared.length) : null,
      highest: appeared.length ? Math.max(...appeared.map((r) => r.percent!)) : null,
      passPercent: appeared.length ? round2((passed / appeared.length) * 100) : null,
    };
  }
}
