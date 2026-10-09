import { Prisma } from '@edurit/database';
import { parseDateOnly, todayDateOnly } from '../../common/utils/date';
import type { PrismaService } from '../../core/database/prisma.service';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
// Vehicle documents expiring within this many days are flagged.
export const EXPIRY_WARNING_DAYS = 30;
const DAY_MS = 86_400_000;

export async function schoolToday(prisma: PrismaService, tenantId: string): Promise<Date> {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
  return todayDateOnly(settings?.timezone || DEFAULT_TIMEZONE);
}

// Whole days from `today` until a DATE column value (negative = already past).
export function daysUntil(date: Date | null | undefined, today: Date): number | null {
  if (!date) return null;
  return Math.round((parseDateOnly(date).getTime() - today.getTime()) / DAY_MS);
}

export const isExpiringSoon = (days: number | null) => days !== null && days <= EXPIRY_WARNING_DAYS;

// Split a search box value into words; every word must match one of the fields.
export function studentSearchWhere(search?: string): Prisma.StudentWhereInput | undefined {
  const words = (search ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (!words.length) return undefined;
  return {
    AND: words.map((word) => ({
      OR: [
        { firstName: { contains: word, mode: 'insensitive' as const } },
        { lastName: { contains: word, mode: 'insensitive' as const } },
        { admissionNumber: { contains: word, mode: 'insensitive' as const } },
      ],
    })),
  };
}

// Student with current-year class/section and the primary guardian's phone.
export const transportStudentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  admissionNumber: true,
  phone: true,
  enrollments: {
    where: { academicYear: { isCurrent: true, deletedAt: null } },
    take: 1,
    select: { rollNumber: true, sectionId: true, section: { select: { name: true, class: { select: { name: true } } } } },
  },
  guardians: {
    orderBy: { isPrimary: 'desc' },
    take: 3,
    select: { relationship: true, parent: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
  },
} satisfies Prisma.StudentSelect;

export type TransportStudent = Prisma.StudentGetPayload<{ select: typeof transportStudentSelect }>;

export function studentView(student: TransportStudent) {
  const enrollment = student.enrollments[0];
  const guardian = student.guardians.find((g) => g.parent.user.phone) ?? student.guardians[0];
  return {
    id: student.id,
    name: `${student.firstName} ${student.lastName}`.trim(),
    admissionNumber: student.admissionNumber,
    rollNumber: enrollment?.rollNumber ?? null,
    sectionId: enrollment?.sectionId ?? null,
    sectionLabel: enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : null,
    guardianName: guardian ? `${guardian.parent.user.firstName} ${guardian.parent.user.lastName}`.trim() : null,
    guardianRelationship: guardian?.relationship ?? null,
    guardianPhone: guardian?.parent.user.phone ?? student.phone ?? null,
  };
}
