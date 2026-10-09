// Response shapes of the /timetable endpoints and the school-day layout.

export interface TimetableEntry {
  id: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon … 6 = Sat
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  subject: { id: string; name: string; code: string };
  staff: { id: string; name: string };
  section: { id: string; label: string };
}

export interface SectionTimetable {
  academicYear: { id: string; name: string };
  section: { id: string; label: string };
  entries: TimetableEntry[];
}

export interface StaffTimetable {
  academicYear: { id: string; name: string };
  staff: { id: string; name: string };
  periodsPerWeek: number;
  entries: TimetableEntry[];
}

export interface CopyResult {
  copied: number;
  skipped: number;
  skippedFilled: number;
  skippedClash: number;
}

// ---------------------------------------------------------------------------
// School-day layout. Adjust these to match the school's bell schedule.
// ---------------------------------------------------------------------------
export const SCHOOL_DAY = {
  start: "08:00",
  periodMinutes: 40,
  periodCount: 8,
  // Breaks are inserted after the given period.
  breaks: [{ afterPeriod: 3, minutes: 20, label: "Break" }],
};

export const DAYS = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
];

export type ScheduleRow =
  | { kind: "period"; period: number; start: string; end: string }
  | { kind: "break"; label: string; start: string; end: string };

const toMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Rows of the weekly grid. Pass a larger periodCount so entries beyond the configured
// count (e.g. a 9th period) still show up.
export function buildSchedule(periodCount = SCHOOL_DAY.periodCount): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let cursor = toMinutes(SCHOOL_DAY.start);
  for (let p = 1; p <= periodCount; p += 1) {
    rows.push({ kind: "period", period: p, start: toTime(cursor), end: toTime(cursor + SCHOOL_DAY.periodMinutes) });
    cursor += SCHOOL_DAY.periodMinutes;
    const brk = SCHOOL_DAY.breaks.find((b) => b.afterPeriod === p);
    if (brk && p < periodCount) {
      rows.push({ kind: "break", label: brk.label, start: toTime(cursor), end: toTime(cursor + brk.minutes) });
      cursor += brk.minutes;
    }
  }
  return rows;
}

// Deterministic colour per subject (static classes so Tailwind keeps them).
const PALETTE = [
  { cell: "bg-blue-50 border-blue-200", dot: "bg-blue-500", text: "text-blue-900" },
  { cell: "bg-green-50 border-green-200", dot: "bg-green-500", text: "text-green-900" },
  { cell: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-900" },
  { cell: "bg-purple-50 border-purple-200", dot: "bg-purple-500", text: "text-purple-900" },
  { cell: "bg-rose-50 border-rose-200", dot: "bg-rose-500", text: "text-rose-900" },
  { cell: "bg-teal-50 border-teal-200", dot: "bg-teal-500", text: "text-teal-900" },
  { cell: "bg-orange-50 border-orange-200", dot: "bg-orange-500", text: "text-orange-900" },
  { cell: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", text: "text-indigo-900" },
  { cell: "bg-lime-50 border-lime-200", dot: "bg-lime-600", text: "text-lime-900" },
  { cell: "bg-cyan-50 border-cyan-200", dot: "bg-cyan-500", text: "text-cyan-900" },
];

export function subjectColor(subjectId: string) {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i += 1) hash = (hash * 31 + subjectId.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0]!;
}

export const TIMETABLE_INVALIDATE = [["timetable"], ["dashboard"]];
