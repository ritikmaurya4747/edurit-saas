// Parsing helpers shared by the Excel/CSV importers. Every parser returns
// either a normalized value or a human-readable problem; nothing throws, so a
// single bad cell never aborts the validation of a whole file.

export type Parsed<T> = { value: T } | { error: string };

export const isError = <T>(p: Parsed<T>): p is { error: string } => 'error' in p;

// Trimmed cell text ('' when empty). Collapses inner whitespace.
export const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

// Lower-case, without spaces / punctuation: "Class - 5 " → "class5".
export const looseKey = (value: string) => value.toLowerCase().replace(/[\s\-_.\/]+/g, '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseEmail(value: string, label: string): Parsed<string | null> {
  const v = clean(value).toLowerCase();
  if (!v) return { value: null };
  if (v.length > 255 || !EMAIL_RE.test(v)) return { error: `${label} '${value.trim()}' is not a valid email address` };
  return { value: v };
}

// Indian mobile: strips spaces, dashes, brackets, a leading +91 / 91 / 0.
// Excel sometimes turns long numbers into "9.87654E+09": that is reported.
export function parseMobile(value: string, label: string): Parsed<string | null> {
  const raw = clean(value);
  if (!raw) return { value: null };
  if (/e\+/i.test(raw)) {
    return { error: `${label} '${raw}' was converted to scientific notation by Excel. Format the column as Text and re-enter it` };
  }
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return { error: `${label} '${raw}' must contain digits only` };
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 10) return { error: `${label} '${raw}' must be a 10-digit mobile number` };
  return { value: digits };
}

// Last 10 digits, used to compare phone numbers stored in any format.
export const phoneKey = (phone: string | null | undefined) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
};

const GENDERS: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
  m: 'MALE',
  male: 'MALE',
  boy: 'MALE',
  b: 'MALE',
  man: 'MALE',
  f: 'FEMALE',
  female: 'FEMALE',
  girl: 'FEMALE',
  g: 'FEMALE',
  woman: 'FEMALE',
  o: 'OTHER',
  other: 'OTHER',
  others: 'OTHER',
  t: 'OTHER',
  transgender: 'OTHER',
};

export function parseGender(value: string): Parsed<'MALE' | 'FEMALE' | 'OTHER' | null> {
  const v = clean(value).toLowerCase().replace(/\.$/, '');
  if (!v) return { value: null };
  const g = GENDERS[v];
  return g ? { value: g } : { error: `Gender '${value.trim()}' is not recognised. Use Male, Female or Other` };
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');

function ymd(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Accepts DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD (also with a time
// part), DD-Mon-YYYY ("15-Jun-2014", "15 June 2014"), YYYYMMDD and Excel
// serial day numbers (e.g. 41805). Returns 'YYYY-MM-DD'.
export function parseDate(value: string, label: string): Parsed<string | null> {
  const v = clean(value);
  if (!v) return { value: null };
  const invalid = { error: `${label} '${v}' is not a valid date. Use DD-MM-YYYY (e.g. 15-06-2014)` };

  // ISO (the browser converts real Excel date cells to this)
  let m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[T\s].*)?$/.exec(v);
  if (m) return wrap(ymd(+m[1], +m[2], +m[3]), invalid);

  m = /^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{2,4})$/.exec(v);
  if (m) {
    if (m[3].length !== 4) return { error: `${label} '${v}' needs a 4-digit year (DD-MM-YYYY)` };
    return wrap(ymd(+m[3], +m[2], +m[1]), invalid);
  }

  m = /^(\d{1,2})[-\/.\s]+([a-z]+)[-\/.,\s]+(\d{4})$/i.exec(v);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? wrap(ymd(+m[3], month, +m[1]), invalid) : invalid;
  }

  if (/^(19|20)\d{6}$/.test(v)) return wrap(ymd(+v.slice(0, 4), +v.slice(4, 6), +v.slice(6, 8)), invalid);

  // Excel serial number (days since 1899-12-30), possibly with a time fraction.
  // Only 1927–2099 so that a stray year ("2014") is not read as a serial.
  if (/^\d{1,6}(\.\d+)?$/.test(v)) {
    const serial = Math.floor(Number(v));
    if (serial >= 10000 && serial <= 73050) {
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
      return { value: d.toISOString().slice(0, 10) };
    }
  }
  return invalid;
}

const wrap = (value: string | null, invalid: { error: string }): Parsed<string | null> =>
  value ? { value } : invalid;

export function parseYesNo(value: string, label: string): Parsed<boolean | null> {
  const v = clean(value).toLowerCase();
  if (!v) return { value: null };
  if (['yes', 'y', 'true', '1', 'teaching'].includes(v)) return { value: true };
  if (['no', 'n', 'false', '0', 'non-teaching', 'nonteaching'].includes(v)) return { value: false };
  return { error: `${label} '${value.trim()}' must be Yes or No` };
}

export function parseAmount(value: string, label: string): Parsed<number | null> {
  const v = clean(value).replace(/[₹,\s]|rs\.?|inr/gi, '');
  if (!v) return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return { error: `${label} '${value.trim()}' must be a positive amount` };
  return { value: Math.round(n * 100) / 100 };
}

export function parsePositiveInt(value: string, label: string, max = 9999): Parsed<number | null> {
  const v = clean(value);
  if (!v) return { value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > max) return { error: `${label} '${v}' must be a whole number between 1 and ${max}` };
  return { value: n };
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// "b positive", "B+ve", "o -ve" → "B+", "O-". Unknown values → null.
export function normalizeBloodGroup(value: string): string | null {
  const v = clean(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/(POSITIVE|POS|\+VE|VE\+)$/, '+')
    .replace(/(NEGATIVE|NEG|-VE|VE-)$/, '-')
    .replace(/^0/, 'O');
  return BLOOD_GROUPS.includes(v) ? v : null;
}

// Splits "Rakesh Kumar Sharma" → { firstName: 'Rakesh Kumar', lastName: 'Sharma' }.
export function splitName(full: string) {
  const parts = clean(full).split(' ').filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
};

// Grade number of a class label: "Class 5", "5", "5th", "Std V", "Grade-10",
// "Class XII" → 5/5/5/5/10/12. null for "Nursery", "LKG", "5A"...
export function classNumber(label: string): number | null {
  const v = clean(label).toLowerCase();
  const m = /^(?:class|grade|std|standard|cls)?\s*[-.:]?\s*(\d{1,2}|[ivx]{1,4})(?:st|nd|rd|th)?(?:\s*(?:class|grade|std|standard))?$/.exec(v);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : ROMAN[m[1]];
  return n && n >= 1 && n <= 12 ? n : null;
}

// "Section A" / "sec. b" / " a " → "A". Section names are stored upper-case.
export const sectionName = (value: string) =>
  clean(value)
    .replace(/^(section|sec\.?)\s*[-:]?\s*/i, '')
    .toUpperCase();

export const personName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();

// Summary of a list for messages: "A, B, C and 4 more".
export function listForMessage(items: string[], max = 6) {
  if (items.length <= max) return items.join(', ');
  return `${items.slice(0, max).join(', ')} and ${items.length - max} more`;
}
