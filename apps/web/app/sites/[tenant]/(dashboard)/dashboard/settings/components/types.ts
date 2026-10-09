export const PROFILE_FIELDS = [
  "address",
  "city",
  "state",
  "pincode",
  "phone",
  "email",
  "website",
  "affiliationBoard",
  "affiliationNumber",
  "principalName",
  "establishedYear",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type SchoolProfile = Record<ProfileField, string>;

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

// Response of GET /v1/settings/school
export interface SchoolSettings {
  tenant: { id: string; name: string; legalName: string | null; slug: string; status: string };
  settings: { currency: string; timezone: string; logoUrl: string | null; customDomain: string | null };
  profile: SchoolProfile;
  subscription: {
    planName: string;
    planCode: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    autoRenew?: boolean;
    maxStudents: number;
    maxStaff: number;
    daysRemaining: number;
  } | null;
  usage: { students: number; staff: number; branches: number; classes: number };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityName: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
}

export const SETTINGS_KEY = ["settings", "school"] as const;

export const CURRENCIES = [
  { value: "INR", label: "INR — Indian Rupee (₹)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "QAR", label: "QAR — Qatari Riyal" },
  { value: "KWD", label: "KWD — Kuwaiti Dinar" },
  { value: "OMR", label: "OMR — Omani Rial" },
  { value: "BHD", label: "BHD — Bahraini Dinar" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "NPR", label: "NPR — Nepalese Rupee" },
  { value: "LKR", label: "LKR — Sri Lankan Rupee" },
  { value: "BDT", label: "BDT — Bangladeshi Taka" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Muscat",
  "Asia/Bahrain",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Karachi",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Bangkok",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "UTC",
];
