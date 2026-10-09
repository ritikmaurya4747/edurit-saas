import type { Decimal } from "@/lib/api/types";

// Response shapes of the /homework endpoints.

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: Decimal | null;
  createdAt: string;
  section: { id: string; label: string };
  subject: { id: string; name: string; code: string };
  staff: { id: string; name: string };
  counts: { totalStudents: number; submitted: number; graded: number };
}

export interface HomeworkSubmission {
  id: string;
  content: string | null;
  submittedAt: string;
  marks: Decimal | null;
  feedback: string | null;
  gradedAt: string | null;
}

export interface HomeworkRosterRow {
  studentId: string;
  name: string;
  admissionNumber: string;
  rollNumber: number | null;
  submission: HomeworkSubmission | null;
}

export interface HomeworkDetail extends HomeworkItem {
  roster: HomeworkRosterRow[];
}

export const HOMEWORK_INVALIDATE = [["homework"], ["dashboard"]];

export const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < Date.now();
