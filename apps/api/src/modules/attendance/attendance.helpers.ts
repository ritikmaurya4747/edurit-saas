import { BadRequestException } from '@nestjs/common';
import { addDays, formatDateOnly, parseDateOnly } from '../../common/utils/date';

// Small helpers shared by the attendance services.

export const SECTION_SELECT = { id: true, name: true, class: { select: { name: true } } } as const;

export const sectionLabel = (section: { name: string; class: { name: string } }) =>
  `${section.class.name} - ${section.name}`;

export const personName = (person?: { firstName?: string | null; lastName?: string | null } | null) =>
  person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() : '';

// (part / whole) as a percentage with one decimal; null when nothing to divide.
export const percent = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;

export const byRollThenName = (
  a: { rollNumber: number | null; name: string },
  b: { rollNumber: number | null; name: string },
) => {
  const ra = a.rollNumber ?? Number.MAX_SAFE_INTEGER;
  const rb = b.rollNumber ?? Number.MAX_SAFE_INTEGER;
  return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
};

export const firstOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

// Resolves an optional from/to pair (defaults: 1st of this month → today) and
// guards against inverted or huge ranges.
export function resolveRange(today: Date, from?: string, to?: string, defaultFrom?: Date) {
  const end = to ? parseDateOnly(to) : today;
  const start = from ? parseDateOnly(from) : (defaultFrom ?? firstOfMonth(end));
  if (start > end) throw new BadRequestException('"From" date must be on or before the "to" date');
  if (addDays(start, 400) < end) throw new BadRequestException('Date range cannot be longer than about a year');
  return { from: start, to: end, fromStr: formatDateOnly(start), toStr: formatDateOnly(end) };
}
