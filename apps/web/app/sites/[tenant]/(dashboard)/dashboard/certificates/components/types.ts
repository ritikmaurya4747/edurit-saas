import type { BadgeTone } from "@/components/ui";

export type CertificateType = "TC" | "BONAFIDE" | "CHARACTER" | "ID_CARD";
export type DocumentType = Exclude<CertificateType, "ID_CARD">;

export const CERTIFICATE_KEYS = [["certificates"], ["students"], ["dashboard"]];

export const TYPE_META: Record<CertificateType, { label: string; title: string; tone: BadgeTone; description: string }> = {
  TC: {
    label: "Transfer Certificate",
    title: "Transfer Certificate",
    tone: "red",
    description: "For students leaving the school. Marks the student as Transferred.",
  },
  BONAFIDE: {
    label: "Bonafide",
    title: "Bonafide Certificate",
    tone: "blue",
    description: "Confirms the student is currently studying here (bank, passport, scholarship…).",
  },
  CHARACTER: {
    label: "Character",
    title: "Character Certificate",
    tone: "green",
    description: "Certifies the student's conduct and character during their time at school.",
  },
  ID_CARD: {
    label: "ID Card",
    title: "Student Identity Card",
    tone: "purple",
    description: "Student identity card.",
  },
};

export interface SchoolBlock {
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  affiliationBoard: string;
  affiliationNumber: string;
  principalName: string;
  establishedYear: string;
  fullAddress: string;
}

export interface StudentBlock {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dob: string | null;
  gender: string;
  bloodGroup: string | null;
  photoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  admissionDate: string | null;
  status: string;
  fatherName: string | null;
  motherName: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
}

export interface EnrollmentBlock {
  academicYearId: string;
  academicYear: string;
  isCurrentYear: boolean;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  label: string;
  rollNumber: number | null;
}

export interface CertificateSnapshot {
  school: SchoolBlock;
  student: StudentBlock;
  enrollment: EnrollmentBlock | null;
  attendance: { academicYear: string; present: number; total: number; percent: number | null } | null;
  lastExam: { examName: string; academicYear: string; percent: number; grade: string; result: string } | null;
  generatedAt: string;
}

// GET /certificates/preview
export interface CertificatePreview extends CertificateSnapshot {
  type: CertificateType;
  title: string;
  issueDate: string;
  warnings: string[];
}

// Submitted fields stored with the certificate.
export interface CertificateDetails {
  reason?: string;
  leavingDate?: string;
  conduct?: string;
  remarks?: string;
  purpose?: string;
  validUpto?: string;
  issueDate?: string;
  studentStatusChanged?: boolean;
  previousStatus?: string;
}

// GET /certificates (rows) and GET /certificates/:id (with snapshot)
export interface IssuedCertificate {
  id: string;
  type: CertificateType;
  title: string;
  serialNumber: string;
  issuedAt: string;
  revokedAt: string | null;
  revoked: boolean;
  revokeReason: string | null;
  student: { id: string; name: string; admissionNumber: string; status: string };
  classSection: string | null;
  issuedBy: { id: string; name: string } | null;
  details: CertificateDetails;
}

export interface IssuedCertificateDetail extends IssuedCertificate {
  snapshot: CertificateSnapshot | null;
}

// Flat data rendered on one ID card.
export interface IdCardData {
  studentId: string;
  name: string;
  admissionNumber: string;
  classSection: string | null;
  rollNumber: number | null;
  dob: string | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  guardianName?: string | null;
  guardianPhone: string | null;
  address: string | null;
}

// GET /certificates/id-cards?sectionId=
export interface IdCardsResponse {
  school: SchoolBlock;
  section: { id: string; label: string };
  academicYear: { id: string; name: string; endDate: string | null };
  defaultValidUpto: string | null;
  students: (IdCardData & {
    gender: string;
    issued: { id: string; serialNumber: string; issuedAt: string; validUpto: string | null } | null;
  })[];
}

export const idCardFromSnapshot = (snapshot: CertificateSnapshot): IdCardData => ({
  studentId: snapshot.student.id,
  name: snapshot.student.name,
  admissionNumber: snapshot.student.admissionNumber,
  classSection: snapshot.enrollment?.label ?? null,
  rollNumber: snapshot.enrollment?.rollNumber ?? null,
  dob: snapshot.student.dob,
  bloodGroup: snapshot.student.bloodGroup,
  photoUrl: snapshot.student.photoUrl,
  guardianName: snapshot.student.guardianName,
  guardianPhone: snapshot.student.guardianPhone,
  address: snapshot.student.address,
});
