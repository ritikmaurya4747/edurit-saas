import { parseDateOnly } from '../../common/utils/date';
import type { PrismaService } from '../../core/database/prisma.service';

// Library rules (school-wide constants for now).
export const FINE_PER_DAY = 2; // rupees per day after the due date
export const MAX_BOOKS_PER_STUDENT = 3; // unreturned books a student may hold
export const DEFAULT_LOAN_DAYS = 14;
export const MAX_RENEW_OVERDUE_DAYS = 30; // renewal refused beyond this

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const DAY_MS = 86_400_000;

export async function schoolTimezone(prisma: PrismaService, tenantId: string): Promise<string> {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
  return settings?.timezone || DEFAULT_TIMEZONE;
}

// Calendar day (UTC-midnight Date) of an instant as seen in the school's timezone.
export function dateInZone(instant: Date, timeZone: string): Date {
  return parseDateOnly(new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant));
}

// Days past the due date on `onDay` (0 when not late).
export function daysLate(dueDate: Date, onDay: Date): number {
  return Math.max(0, Math.round((onDay.getTime() - parseDateOnly(dueDate).getTime()) / DAY_MS));
}

export const fineFor = (lateDays: number) => lateDays * FINE_PER_DAY;
