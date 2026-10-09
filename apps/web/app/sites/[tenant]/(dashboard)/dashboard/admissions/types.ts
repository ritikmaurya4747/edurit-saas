// API shapes for /v1/admissions (see apps/api/src/modules/admissions).
import type { BadgeTone } from "@/components/ui";

export type AdmissionStage =
  | "ENQUIRY"
  | "DOCUMENT_VERIFICATION"
  | "ENTRANCE_TEST"
  | "OFFER_SENT"
  | "ADMITTED"
  | "WAITLISTED"
  | "REJECTED";

export interface Enquiry {
  id: string;
  studentName: string;
  parentName: string | null;
  phone: string;
  email: string | null;
  dob: string | null;
  gender: string | null;
  classApplied: string;
  source: string;
  stage: AdmissionStage;
  testDate: string | null;
  testScore: string | number | null;
  notes: string | null;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionStats {
  byStage: Record<AdmissionStage, number>;
  total: number;
  admitted: number;
  conversionRate: number;
}

// Kanban columns, in pipeline order.
export const PIPELINE_STAGES: AdmissionStage[] = [
  "ENQUIRY",
  "DOCUMENT_VERIFICATION",
  "ENTRANCE_TEST",
  "OFFER_SENT",
  "ADMITTED",
];

export const STAGE_LABEL: Record<AdmissionStage, string> = {
  ENQUIRY: "Enquiry",
  DOCUMENT_VERIFICATION: "Document Verification",
  ENTRANCE_TEST: "Entrance Test",
  OFFER_SENT: "Offer Sent",
  ADMITTED: "Admitted",
  WAITLISTED: "Waitlisted",
  REJECTED: "Rejected",
};

export const STAGE_TONE: Record<AdmissionStage, BadgeTone> = {
  ENQUIRY: "gray",
  DOCUMENT_VERIFICATION: "yellow",
  ENTRANCE_TEST: "purple",
  OFFER_SENT: "blue",
  ADMITTED: "green",
  WAITLISTED: "orange",
  REJECTED: "red",
};

export const SOURCE_OPTIONS = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "PHONE", label: "Phone" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "OTHER", label: "Other" },
];

// Set only by the public /apply form (not offered when creating an enquiry by hand).
export const ONLINE_FORM_SOURCE = "ONLINE_FORM";

export const sourceLabel = (source: string) =>
  source === ONLINE_FORM_SOURCE ? "Online form" : (SOURCE_OPTIONS.find((s) => s.value === source)?.label ?? source);

// GET/PUT /admissions/online-form/settings
export interface OnlineFormSettings {
  onlineFormEnabled: boolean;
  formMessage: string;
  classesOpen: string[];
  academicYearLabel: string;
  publicPath: string;
}

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

// ISO instant → value for <input type="datetime-local"> in the browser's timezone.
export const toDateTimeInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

// Row/card actions wired up by AdmissionsPage and shared by every tab.
export interface EnquiryActions {
  canManage: boolean;
  canAdmit: boolean;
  movingId: string | null;
  move: (enquiry: Enquiry, stage: AdmissionStage) => void;
  edit: (enquiry: Enquiry) => void;
  admit: (enquiry: Enquiry) => void;
  reject: (enquiry: Enquiry) => void;
  recordTest: (enquiry: Enquiry) => void;
  remove: (enquiry: Enquiry) => void;
}
