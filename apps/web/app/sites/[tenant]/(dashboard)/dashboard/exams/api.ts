"use client";

// Examination domain: response types + query hooks shared by the Exams,
// Report Cards and Desk Slips pages. Every query key starts with "exams" so a
// single invalidation of ["exams"] refreshes all three pages.
import { useApiQuery } from "@/lib/api/hooks";
import type { Decimal } from "@/lib/api/types";

export const EXAM_KEY = "exams";
export const EXAM_INVALIDATE = [[EXAM_KEY], ["dashboard"]];

export interface ExamListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  academicYearId: string;
  academicYear: { id: string; name: string };
  subjectCount: number;
  marksEntered: number;
}

export interface ExamSubjectItem {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; code: string };
  examDate: string;
  maxMarks: Decimal;
  passingMarks: Decimal;
  paperPdfUrl: string | null;
  marksCount: number;
}

export interface ExamDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  academicYearId: string;
  academicYear: { id: string; name: string; startDate: string; endDate: string };
  examSubjects: ExamSubjectItem[];
}

export interface MarksRoster {
  examSubject: {
    id: string;
    subject: { id: string; name: string; code: string };
    examDate: string;
    maxMarks: Decimal;
    passingMarks: Decimal;
  };
  exam: { id: string; name: string; isPublished: boolean };
  section: { id: string; label: string };
  students: {
    studentId: string;
    name: string;
    rollNumber: number | null;
    admissionNumber: string;
    marksObtained: number | null;
    remarks: string | null;
  }[];
}

export type ResultStatus = "PASS" | "FAIL" | null;

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
  result: ResultStatus;
  rank: number | null;
}

export interface SectionResults {
  exam: { id: string; name: string; isPublished: boolean };
  section: { id: string; label: string };
  subjects: { examSubjectId: string; subjectName: string; subjectCode: string; maxMarks: number; passingMarks: number }[];
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

export interface ReportCardListItem {
  id: string;
  studentId: string;
  name: string;
  admissionNumber: string;
  rollNumber: number | null;
  sectionId: string;
  sectionLabel: string;
  overallPercent: Decimal;
  grade: string;
  rank: number | null;
  result: ResultStatus;
  remarks: string | null;
  generatedAt: string;
}

export interface ReportCardDetail {
  reportCardId: string | null;
  school: { name: string; logoUrl: string | null };
  student: {
    id: string;
    name: string;
    admissionNumber: string;
    dob: string;
    rollNumber: number | null;
    className: string;
    sectionName: string;
    sectionId: string;
    guardianName: string | null;
    guardianRelationship: string | null;
  };
  exam: { id: string; name: string; startDate: string; endDate: string; isPublished: boolean; academicYear: string | null };
  subjects: {
    examSubjectId: string;
    name: string;
    code: string;
    maxMarks: number;
    passingMarks: number;
    marksObtained: number | null;
    percent: number | null;
    grade: string | null;
    passed: boolean | null;
    remarks: string | null;
  }[];
  totals: {
    obtained: number;
    max: number;
    percent: number | null;
    grade: string | null;
    result: ResultStatus;
    rank: number | null;
    classSize: number;
  };
  attendance: { present: number; total: number; percent: number | null };
  remarks: string | null;
  overallPercent: number | null;
  generatedAt: string | null;
}

export type SeatStatus = "GENERATED" | "PRINTED" | "ASSIGNED";

export interface SeatItem {
  id: string;
  roomNumber: string;
  seatNumber: string;
  status: SeatStatus;
  student: { id: string; name: string; admissionNumber: string; rollNumber: number | null };
  sectionId: string | null;
  sectionLabel: string | null;
}

export const useExams = (academicYearId?: string | null) =>
  useApiQuery<ExamListItem[]>([EXAM_KEY, "list"], academicYearId === null ? null : "exams", {
    academicYearId: academicYearId || undefined,
  });

export const useExam = (id?: string | null) => useApiQuery<ExamDetail>([EXAM_KEY, "detail", id], id ? `exams/${id}` : null);

export const useSectionResults = (examId?: string | null, sectionId?: string | null) =>
  useApiQuery<SectionResults>(
    [EXAM_KEY, "results", examId],
    examId && sectionId ? `exams/${examId}/results` : null,
    { sectionId: sectionId || undefined },
  );

// Display helpers -----------------------------------------------------------
export const fmtMarks = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
};

export const fmtPercent = (value: number | string | null | undefined) =>
  value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`;

export const gradeTone = (grade?: string | null) => {
  if (!grade) return "gray" as const;
  if (grade.startsWith("A")) return "green" as const;
  if (grade.startsWith("B")) return "blue" as const;
  if (grade.startsWith("C")) return "yellow" as const;
  if (grade === "D") return "orange" as const;
  return "red" as const;
};
