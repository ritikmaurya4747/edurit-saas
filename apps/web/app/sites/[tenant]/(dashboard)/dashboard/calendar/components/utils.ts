import type { BadgeTone, SelectOption } from "@/components/ui";

export type CalendarType = "HOLIDAY" | "EVENT" | "EXAM" | "PTM" | "ACTIVITY" | "OTHER";
export type CalendarAudience = "ALL" | "STAFF" | "STUDENT" | "PARENT";

// GET /calendar/events and /calendar/upcoming
export interface CalendarItem {
  source: "CALENDAR" | "EXAM";
  id: string;
  title: string;
  description: string | null;
  type: CalendarType;
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  targetRole: CalendarAudience | string;
  readOnly: boolean;
}

export interface EventForm {
  id?: string;
  title: string;
  description: string;
  type: CalendarType;
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  targetRole: CalendarAudience;
}

export const CALENDAR_KEYS = [["calendar"], ["dashboard"]];

export const TYPE_STYLE: Record<CalendarType, { label: string; chip: string; dot: string; tone: BadgeTone }> = {
  HOLIDAY: { label: "Holiday", chip: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500", tone: "red" },
  EXAM: { label: "Exam", chip: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500", tone: "purple" },
  PTM: { label: "PTM", chip: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", tone: "blue" },
  EVENT: { label: "Event", chip: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500", tone: "green" },
  ACTIVITY: { label: "Activity", chip: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", tone: "orange" },
  OTHER: { label: "Other", chip: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400", tone: "gray" },
};

export const TYPE_OPTIONS: SelectOption[] = (Object.keys(TYPE_STYLE) as CalendarType[]).map((t) => ({
  value: t,
  label: TYPE_STYLE[t].label,
}));

export const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  STAFF: "Staff only",
  STUDENT: "Students",
  PARENT: "Parents",
};

export const AUDIENCE_OPTIONS: SelectOption[] = Object.entries(AUDIENCE_LABEL).map(([value, label]) => ({ value, label }));

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---- date helpers: every date is a "YYYY-MM-DD" string handled in UTC ----

export const ymd = (date: Date) => date.toISOString().slice(0, 10);
export const day = (value: string) => value.slice(0, 10);
export const parseYmd = (value: string) => new Date(`${day(value)}T00:00:00Z`);

export const addDaysYmd = (value: string, days: number) => {
  const d = parseYmd(value);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
};

// Today in the school's timezone.
export const todayIn = (timeZone?: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || undefined }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
};

export const monthLabel = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" });

// Weeks (Mon–Sun) covering the month.
export function monthWeeks(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const start = ymd(new Date(Date.UTC(year, month, 1 - ((first.getUTCDay() + 6) % 7))));
  const end = ymd(new Date(Date.UTC(year, month + 1, (7 - last.getUTCDay()) % 7)));
  const weeks: string[][] = [];
  for (let cursor = start; cursor <= end; ) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDaysYmd(cursor, 1);
    }
    weeks.push(week);
  }
  return { start, end, weeks };
}

export const coversDay = (item: CalendarItem, date: string) => day(item.startDate) <= date && day(item.endDate) >= date;

export interface WeekSegment {
  item: CalendarItem;
  startCol: number;
  endCol: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

// Places the items overlapping a week into lanes so multi-day events render as
// one bar spanning their days.
export function layoutWeek(week: string[], items: CalendarItem[]): WeekSegment[] {
  const weekStart = week[0] ?? "";
  const weekEnd = week[6] ?? "";
  const segments = items
    .filter((i) => day(i.startDate) <= weekEnd && day(i.endDate) >= weekStart)
    .map((item) => {
      const s = day(item.startDate) < weekStart ? weekStart : day(item.startDate);
      const e = day(item.endDate) > weekEnd ? weekEnd : day(item.endDate);
      return {
        item,
        startCol: week.indexOf(s),
        endCol: week.indexOf(e),
        lane: 0,
        continuesBefore: day(item.startDate) < weekStart,
        continuesAfter: day(item.endDate) > weekEnd,
      };
    })
    .sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol));

  const laneEnds: number[] = [];
  for (const seg of segments) {
    let lane = laneEnds.findIndex((end) => end < seg.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(seg.endCol);
    } else {
      laneEnds[lane] = seg.endCol;
    }
    seg.lane = lane;
  }
  return segments;
}

export const isHolidayItem = (item: CalendarItem) => item.isHoliday || item.type === "HOLIDAY";

export function formatRange(start: string, end: string) {
  const fmt = (v: string, withYear: boolean) =>
    parseYmd(v).toLocaleDateString("en-IN", {
      timeZone: "UTC",
      weekday: "short",
      day: "2-digit",
      month: "short",
      ...(withYear && { year: "numeric" }),
    });
  if (day(start) === day(end)) return fmt(start, true);
  return `${fmt(start, false)} – ${fmt(end, true)}`;
}
