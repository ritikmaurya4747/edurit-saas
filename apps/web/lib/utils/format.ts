export const getInitials = (name?: string) => {
  if (!name) return "U";

  const words = name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const first = words[0];
  const last = words[words.length - 1];

  if (!first) return "U";
  if (!last || words.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

export const formatRole = (role?: string) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// "PARTIALLY_PAID" → "Partially Paid"
export const humanize = formatRole;

// DATE columns come back as UTC-midnight ISO strings; format in UTC so the
// day never shifts in the browser's timezone. → "09 Oct 2026"
export const formatDate = (value?: string | Date | null, withWeekday = false) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withWeekday && { weekday: "short" }),
  });
};

// Timestamps (check-in, payment time) are real instants: show in local time.
export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const formatTime = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// Decimal strings from the API ("1250.00") → "₹1,250"
export const formatCurrency = (value?: string | number | null, currency = "INR") => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatNumber = (value?: string | number | null) =>
  new Intl.NumberFormat("en-IN").format(Number(value ?? 0));

// ISO → "YYYY-MM-DD" for <input type="date">
export const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

// Today's date as "YYYY-MM-DD" in the browser's local timezone.
export const todayInput = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const fullName = (person?: { firstName?: string | null; lastName?: string | null } | null) =>
  person ? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() : "";
