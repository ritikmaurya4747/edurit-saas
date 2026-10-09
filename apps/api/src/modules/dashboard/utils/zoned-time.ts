// Helpers for converting a school's calendar day into real instants, for
// filtering timestamp (timestamptz) columns by "a day in the school's timezone".

// Offset (ms) of `timeZone` from UTC at the instant `at`. IST → +19800000.
function timeZoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

// `day` is a date-only value (UTC midnight, as from parseDateOnly). Returns the
// instant at which that calendar day starts in `timeZone`.
export function zonedDayStart(day: Date, timeZone = 'Asia/Kolkata'): Date {
  const local = day.getTime();
  let offset = timeZoneOffsetMs(new Date(local), timeZone);
  let result = local - offset;
  // Re-evaluate once around DST transitions.
  const second = timeZoneOffsetMs(new Date(result), timeZone);
  if (second !== offset) {
    offset = second;
    result = local - offset;
  }
  return new Date(result);
}

// [start, end) instants covering the school's calendar day.
export function zonedDayRange(day: Date, timeZone = 'Asia/Kolkata'): { gte: Date; lt: Date } {
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + 1);
  return { gte: zonedDayStart(day, timeZone), lt: zonedDayStart(next, timeZone) };
}
