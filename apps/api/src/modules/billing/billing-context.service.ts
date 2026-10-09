import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { todayDateOnly } from '../../common/utils/date';
import { AcademicYearsService } from '../academic/academic-years.service';
import { studentName } from './billing.utils';

// Shared lookups for the billing services: tenant currency/timezone, academic
// year resolution, student class-section labels.
@Injectable()
export class BillingContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly years: AcademicYearsService,
  ) {}

  async settings(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { currency: true, timezone: true, logoUrl: true },
    });
    const timezone = settings?.timezone || 'Asia/Kolkata';
    return {
      currency: settings?.currency || 'INR',
      timezone,
      logoUrl: settings?.logoUrl ?? null,
      today: todayDateOnly(timezone),
    };
  }

  // Validated year id, or the current year (400 if none is configured).
  async requireYearId(tenantId: string, academicYearId?: string): Promise<string> {
    if (academicYearId) {
      await this.assertYear(tenantId, academicYearId);
      return academicYearId;
    }
    return (await this.years.requireCurrent(tenantId)).id;
  }

  // For read endpoints: validated year id, the current year, or null when none is set.
  async yearIdOrCurrent(tenantId: string, academicYearId?: string): Promise<string | null> {
    if (academicYearId) {
      await this.assertYear(tenantId, academicYearId);
      return academicYearId;
    }
    const current = await this.years.current(tenantId);
    return current?.id ?? null;
  }

  private async assertYear(tenantId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, tenantId, deletedAt: null }, select: { id: true } });
    if (!year) throw new NotFoundException('Academic year not found');
  }

  async requireStudent(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, status: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // studentId → "Class 8 - B" from the current-year enrollment.
  async sectionLabels(tenantId: string, studentIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const ids = [...new Set(studentIds)];
    if (!ids.length) return map;
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenantId, studentId: { in: ids }, academicYear: { isCurrent: true, deletedAt: null } },
      select: { studentId: true, section: { select: { name: true, class: { select: { name: true } } } } },
    });
    enrollments.forEach((e) => map.set(e.studentId, `${e.section.class.name} - ${e.section.name}`));
    return map;
  }

  async studentSummary(tenantId: string, studentId: string) {
    const student = await this.requireStudent(tenantId, studentId);
    const labels = await this.sectionLabels(tenantId, [studentId]);
    return {
      id: student.id,
      name: studentName(student),
      admissionNumber: student.admissionNumber,
      status: student.status,
      sectionLabel: labels.get(student.id) ?? null,
    };
  }
}
