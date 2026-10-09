import { BadRequestException } from '@nestjs/common';

// Postgres DATE columns map to JS Dates at UTC midnight. Always build them
// from a 'YYYY-MM-DD' string so the stored day never shifts with the server TZ.
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new BadRequestException(`Invalid date '${value}', expected YYYY-MM-DD`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`Invalid date '${value}'`);
  return date;
}

// Today's calendar date in the given IANA timezone (schools are TZ-local).
export function todayDateOnly(timeZone = 'Asia/Kolkata'): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  return parseDateOnly(ymd);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// 0 = Sunday ... 6 = Saturday, matching Timetable.dayOfWeek.
export function dayOfWeek(date: Date): number {
  return date.getUTCDay();
}
