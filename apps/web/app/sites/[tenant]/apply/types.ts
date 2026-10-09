// Shapes of the public admission API (apps/api/src/modules/public).

export interface PublicSchool {
  name: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  affiliationBoard: string | null;
}

export interface AdmissionFormInfo {
  school: PublicSchool;
  enabled: boolean;
  message: string | null;
  classes: string[];
  academicYearLabel: string | null;
}

export interface EnquiryInput {
  studentName: string;
  dob: string;
  gender: string;
  classApplied: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  previousSchool: string;
  notes: string;
  // Honeypot — must stay empty.
  website: string;
}

export type SubmitResult = { ok: true; reference: string } | { ok: false; message: string };

export const ENQUIRY_FIELDS: (keyof EnquiryInput)[] = [
  "studentName",
  "dob",
  "gender",
  "classApplied",
  "parentName",
  "phone",
  "email",
  "address",
  "previousSchool",
  "notes",
  "website",
];

export const MAX_LENGTH = {
  studentName: 100,
  parentName: 100,
  email: 254,
  address: 500,
  previousSchool: 200,
  notes: 1000,
} as const;

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// "+91 98765 43210" / "09876543210" / "919876543210" → "9876543210" (or the cleaned input if it is not 10 digits).
export const normaliseMobile = (value: string) => {
  let digits = value.replace(/[\s().-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

export const formatMobile = (tenDigits: string) =>
  /^\d{10}$/.test(tenDigits) ? `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` : tenDigits;
