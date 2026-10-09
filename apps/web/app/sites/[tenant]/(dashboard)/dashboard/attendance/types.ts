// Response shapes of the /attendance and /student-leaves endpoints.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export interface StatusCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface RosterStudent {
  studentId: string;
  name: string;
  rollNumber: number | null;
  admissionNumber: string;
  status: AttendanceStatus | null;
  remarks: string | null;
  onLeave: boolean;
  guardianPhone: string | null;
}

export interface Roster {
  date: string;
  periodNumber: number;
  section: { id: string; label: string };
  session: { id: string; markedAt: string; takenBy: string } | null;
  students: RosterStudent[];
}

export interface MarkResult extends StatusCounts {
  sessionId: string;
  date: string;
  total: number;
  percent: number | null;
}

export interface SectionSummaryRow extends StatusCounts {
  sectionId: string;
  label: string;
  totalStudents: number;
  marked: boolean;
  percent: number | null;
}

export interface DailySummary {
  date: string;
  totals: StatusCounts & {
    marked: number;
    totalStudents: number;
    percent: number | null;
    sectionsMarked: number;
    sectionsTotal: number;
  };
  sections: SectionSummaryRow[];
}

export interface ReportStudent extends StatusCounts {
  studentId: string;
  name: string;
  rollNumber: number | null;
  admissionNumber: string;
  marked: number;
  percent: number | null;
}

export interface AttendanceReport {
  from: string;
  to: string;
  section: { id: string; label: string };
  workingDays: number;
  students: ReportStudent[];
}

export interface StudentLeave {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
  sectionId: string | null;
  sectionLabel: string | null;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  actionReason: string | null;
  createdAt: string;
}

// "Today" in the school's timezone as YYYY-MM-DD (falls back to the browser).
export const schoolToday = (timeZone?: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || undefined }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
};

export const ATTENDANCE_INVALIDATE = [["attendance"], ["dashboard"]];
