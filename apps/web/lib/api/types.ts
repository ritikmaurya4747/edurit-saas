// Shared API response shapes used across several pages. Page-specific types
// live next to the page (e.g. app/.../students/types.ts).
// Note: Prisma Decimal fields arrive as strings ("1250.00"); DATE fields as
// ISO strings at UTC midnight ("2026-04-01T00:00:00.000Z").

export type Decimal = string | number;

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: { enrollments: number; exams: number };
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: Record<string, string> | null;
  _count?: { classes: number; staff: number; students: number };
}

export interface SectionSummary {
  id: string;
  name: string;
  capacity: number;
  studentCount: number;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branch: { id: string; name: string; code: string };
  sections: SectionSummary[];
  studentCount: number;
}

// Flat section option: label is "Class 8 - B"
export interface SectionOption {
  id: string;
  name: string;
  capacity: number;
  studentCount: number;
  classId: string;
  className: string;
  label: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

// GET /staff/options
export interface StaffOption {
  id: string;
  name: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  isTeachingStaff: boolean;
}

// GET /students/options?sectionId=
export interface StudentOption {
  id: string;
  name: string;
  admissionNumber: string;
  rollNumber: number | null;
  sectionId: string | null;
  sectionLabel: string | null;
}
