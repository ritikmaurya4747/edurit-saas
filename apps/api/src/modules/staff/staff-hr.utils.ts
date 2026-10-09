import { randomInt } from 'crypto';
import { StaffStatus } from '@edurit/database';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, formatDateOnly } from '../../common/utils/date';

// Staff who are still employed (count towards the plan limit, appear on the
// attendance roster, get payroll and appraisals).
export const EMPLOYED_STATUSES: StaffStatus[] = [StaffStatus.ACTIVE, StaffStatus.ON_LEAVE];

// Check-ins after this school-local time are marked LATE.
export const LATE_AFTER = { hour: 8, minute: 15 };

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Leave types that are paid (anything else, i.e. UNPAID, is loss-of-pay).
export const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
export const UNPAID_LEAVE_TYPE: LeaveType = 'UNPAID';

const DAY_MS = 86_400_000;

// ADMIN always passes the guard, so mirror that for in-service checks.
export const hasPermission = (user: AuthUser, code: string) => user.isAdmin || user.permissions.includes(code);

export const staffName = (user: { firstName: string; lastName: string }) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

// Inclusive number of calendar days between two DATE values.
export const inclusiveDays = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;

export const daysInMonth = (month: number, year: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const monthRange = (month: number, year: number) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month - 1, daysInMonth(month, year)));
  return { start, end };
};

// Every 'YYYY-MM-DD' between two dates (inclusive), clipped to [clipStart, clipEnd].
export function eachDate(start: Date, end: Date, clipStart?: Date, clipEnd?: Date): string[] {
  const from = clipStart && clipStart > start ? clipStart : start;
  const to = clipEnd && clipEnd < end ? clipEnd : end;
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(formatDateOnly(d));
  return dates;
}

// Calendar date ('YYYY-MM-DD') and minutes-since-midnight of an instant in a timezone.
export function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

// Strong random password: 12 chars incl. upper, lower, digit and symbol.
export function generatePassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&*!?';
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[randomInt(set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
