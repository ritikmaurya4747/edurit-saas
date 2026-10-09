// API shapes for /v1/students and /v1/parents (see apps/api/src/modules/students).
import type { BadgeTone } from "@/components/ui";

export type StudentStatus = "ACTIVE" | "ALUMNI" | "TRANSFERRED" | "DROPPED";

export interface EnrollmentInfo {
  id: string;
  rollNumber: number | null;
  section: { id: string; name: string };
  class: { id: string; name: string };
  sectionLabel: string;
}

export interface StudentListItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: string;
  dob: string;
  phone: string | null;
  status: StudentStatus;
  admissionDate: string;
  enrollment: EnrollmentInfo | null;
  primaryGuardian: { name: string; phone: string | null; relationship: string } | null;
}

export interface StudentGuardianItem {
  guardianId: string;
  parentId: string;
  relationship: string;
  isPrimary: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
}

export interface EnrollmentHistoryItem extends EnrollmentInfo {
  academicYear: { id: string; name: string; isCurrent: boolean };
}

export interface StudentProfile {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  photoUrl: string | null;
  admissionDate: string;
  status: StudentStatus;
  branchId: string;
  branch: { id: string; name: string; code: string };
  currentEnrollment: EnrollmentInfo | null;
  enrollments: EnrollmentHistoryItem[];
  guardians: StudentGuardianItem[];
  attendanceSummary: { present: number; absent: number; late: number; excused: number; total: number; percent: number };
  feeSummary: { totalInvoiced: number; totalPaid: number; balance: number; overdueCount: number };
}

export interface ParentListItem {
  id: string;
  name: string;
  occupation: string | null;
  user: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null };
  children: { id: string; name: string; admissionNumber: string; relationship: string; isPrimary: boolean }[];
}

export interface PromoteResult {
  promoted: number;
  skipped: number;
  toSectionLabel: string;
  toAcademicYear: string;
}

export const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "DROPPED", label: "Dropped" },
];

export const STATUS_TONE: Record<StudentStatus, BadgeTone> = {
  ACTIVE: "green",
  ALUMNI: "blue",
  TRANSFERRED: "orange",
  DROPPED: "red",
};

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const RELATIONSHIP_OPTIONS = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "GRANDPARENT", label: "Grandparent" },
  { value: "SIBLING", label: "Sibling" },
  { value: "UNCLE", label: "Uncle" },
  { value: "AUNT", label: "Aunt" },
  { value: "OTHER", label: "Other" },
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => ({ value: g, label: g }));

// Whole years between a DATE (UTC midnight ISO) and today.
export const ageFrom = (dob?: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getUTCFullYear();
  const beforeBirthday =
    now.getMonth() < d.getUTCMonth() || (now.getMonth() === d.getUTCMonth() && now.getDate() < d.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
};
