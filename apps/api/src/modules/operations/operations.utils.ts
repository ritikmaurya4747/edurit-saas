import { addDays, formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import type { PrismaService } from '../../core/database/prisma.service';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export async function getTenantTimezone(prisma: PrismaService, tenantId: string): Promise<string> {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
  return settings?.timezone || DEFAULT_TIMEZONE;
}

// Offset (ms) of `timeZone` from UTC at the given instant.
function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// The UTC instant at which the calendar day `day` starts in `timeZone`.
export function zonedDayStart(day: Date | string, timeZone: string): Date {
  const utcMidnight = parseDateOnly(day);
  const guess = new Date(utcMidnight.getTime() - tzOffsetMs(utcMidnight, timeZone));
  // Re-evaluate the offset at the guessed instant (handles DST transitions).
  return new Date(utcMidnight.getTime() - tzOffsetMs(guess, timeZone));
}

// [start, end) of one or more school-local days, for timestamp columns.
export function zonedRange(from: Date | string, to: Date | string, timeZone: string) {
  return { gte: zonedDayStart(from, timeZone), lt: zonedDayStart(addDays(parseDateOnly(to), 1), timeZone) };
}

export function todayString(timeZone: string): string {
  return formatDateOnly(todayDateOnly(timeZone));
}
