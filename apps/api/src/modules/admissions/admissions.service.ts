import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionStage, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { round2 } from '../../common/utils/money';
import { StudentsService } from '../students/students.service';
import type { CreateStudentDto } from '../students/dto/students.dto';
import {
  AdmissionListQueryDto,
  AdmitEnquiryDto,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  UpdateStageDto,
} from './dto/admissions.dto';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
};

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly students: StudentsService,
  ) {}

  list(tenantId: string, query: AdmissionListQueryDto) {
    const term = query.search?.trim();
    const where: Prisma.AdmissionEnquiryWhereInput = {
      tenantId,
      ...(query.stage && { stage: query.stage }),
      ...(query.classApplied?.trim() && { classApplied: { equals: query.classApplied.trim(), mode: 'insensitive' } }),
      ...(term && {
        OR: [
          { studentName: { contains: term, mode: 'insensitive' } },
          { parentName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
        ],
      }),
    };
    return this.prisma.admissionEnquiry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  }

  async stats(tenantId: string) {
    const groups = await this.prisma.admissionEnquiry.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { _all: true },
    });
    const byStage = Object.fromEntries(Object.values(AdmissionStage).map((s) => [s, 0])) as Record<AdmissionStage, number>;
    groups.forEach((g) => (byStage[g.stage] = g._count._all));
    const total = Object.values(byStage).reduce((sum, n) => sum + n, 0);
    return {
      byStage,
      total,
      admitted: byStage.ADMITTED,
      // Percentage of all enquiries that ended in admission.
      conversionRate: total ? round2((byStage.ADMITTED / total) * 100) : 0,
    };
  }

  async get(tenantId: string, id: string) {
    return this.findOrThrow(tenantId, id);
  }

  async create(user: AuthUser, dto: CreateAdmissionDto) {
    const enquiry = await this.prisma.admissionEnquiry.create({
      data: {
        tenantId: user.tenantId,
        studentName: dto.studentName,
        parentName: dto.parentName ?? null,
        phone: dto.phone,
        email: dto.email?.toLowerCase() ?? null,
        dob: dto.dob ? parseDateOnly(dto.dob) : null,
        gender: dto.gender ?? null,
        classApplied: dto.classApplied,
        source: dto.source ?? 'WALK_IN',
        testDate: dto.testDate ? new Date(dto.testDate) : null,
        testScore: dto.testScore ?? null,
        notes: dto.notes ?? null,
      },
    });
    await this.audit.log(user, 'CREATE', 'AdmissionEnquiry', enquiry.id, {
      studentName: enquiry.studentName,
      classApplied: enquiry.classApplied,
    });
    return enquiry;
  }

  async update(user: AuthUser, id: string, dto: UpdateAdmissionDto) {
    await this.findOrThrow(user.tenantId, id);
    const enquiry = await this.prisma.admissionEnquiry.update({
      where: { id },
      data: {
        studentName: dto.studentName,
        parentName: dto.parentName,
        phone: dto.phone,
        email: dto.email === undefined ? undefined : (dto.email?.toLowerCase() ?? null),
        dob: dto.dob === undefined ? undefined : dto.dob ? parseDateOnly(dto.dob) : null,
        gender: dto.gender,
        classApplied: dto.classApplied,
        source: dto.source,
        testDate: dto.testDate === undefined ? undefined : dto.testDate ? new Date(dto.testDate) : null,
        testScore: dto.testScore,
        notes: dto.notes,
      },
    });
    await this.audit.log(user, 'UPDATE', 'AdmissionEnquiry', id, { ...dto });
    return enquiry;
  }

  async changeStage(user: AuthUser, id: string, dto: UpdateStageDto) {
    const enquiry = await this.findOrThrow(user.tenantId, id);
    if (enquiry.stage === AdmissionStage.ADMITTED) {
      throw new BadRequestException('This applicant has already been admitted; the stage can no longer change');
    }
    if (dto.stage === AdmissionStage.ADMITTED) {
      throw new BadRequestException('Use "Admit" to admit the applicant (it creates the student record)');
    }
    const notes = dto.notes ? await this.appendNote(user.tenantId, enquiry.notes, `${dto.stage}: ${dto.notes}`) : undefined;
    const updated = await this.prisma.admissionEnquiry.update({
      where: { id },
      data: { stage: dto.stage, notes },
    });
    await this.audit.log(user, 'STAGE_CHANGE', 'AdmissionEnquiry', id, { from: enquiry.stage, to: dto.stage, notes: dto.notes });
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const enquiry = await this.findOrThrow(user.tenantId, id);
    if (enquiry.stage === AdmissionStage.ADMITTED || enquiry.studentId) {
      throw new BadRequestException('Admitted enquiries are kept for records and cannot be deleted');
    }
    await this.prisma.admissionEnquiry.delete({ where: { id } });
    await this.audit.log(user, 'DELETE', 'AdmissionEnquiry', id, { studentName: enquiry.studentName });
    return { id, deleted: true };
  }

  // Creates the student (with enrollment + parent login) from the enquiry and
  // marks the enquiry ADMITTED.
  async admit(user: AuthUser, id: string, dto: AdmitEnquiryDto) {
    const enquiry = await this.findOrThrow(user.tenantId, id);
    if (enquiry.stage === AdmissionStage.ADMITTED || enquiry.studentId) {
      throw new BadRequestException('This applicant has already been admitted');
    }

    const dob = dto.dob ?? (enquiry.dob ? formatDateOnly(enquiry.dob) : undefined);
    if (!dob) throw new BadRequestException('Date of birth is required to admit the applicant');
    const gender = (dto.gender ?? enquiry.gender ?? '').toUpperCase();
    if (!GENDERS.includes(gender)) throw new BadRequestException('Gender (MALE, FEMALE or OTHER) is required to admit the applicant');

    const student = splitName(enquiry.studentName);
    const parent = splitName(enquiry.parentName || '');
    const guardianEmail = dto.guardianEmail ?? enquiry.email ?? undefined;
    const hasPhoneDigits = /\d{6,}/.test(enquiry.phone ?? '');

    const payload: CreateStudentDto = {
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: dto.admissionNumber,
      dob,
      gender,
      sectionId: dto.sectionId,
      rollNumber: dto.rollNumber,
      academicYearId: dto.academicYearId,
      guardian:
        parent.firstName && (hasPhoneDigits || guardianEmail)
          ? {
              firstName: parent.firstName,
              lastName: parent.lastName,
              relationship: 'GUARDIAN',
              phone: enquiry.phone,
              email: guardianEmail,
            }
          : undefined,
    };

    const created = await this.students.create(user, payload);

    // Guard against a concurrent double-admit: only flip a non-admitted row.
    const { count } = await this.prisma.admissionEnquiry.updateMany({
      where: { id, tenantId: user.tenantId, studentId: null },
      data: { stage: AdmissionStage.ADMITTED, studentId: created.id, ...(!enquiry.dob && { dob: parseDateOnly(dob) }), ...(!enquiry.gender && { gender }) },
    });
    if (!count) throw new ConflictException('This applicant was admitted by someone else at the same time');

    await this.audit.log(user, 'ADMIT', 'AdmissionEnquiry', id, {
      studentId: created.id,
      admissionNumber: created.admissionNumber,
    });
    return { enquiry: await this.findOrThrow(user.tenantId, id), student: created };
  }

  private async appendNote(tenantId: string, existing: string | null, note: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    const day = formatDateOnly(todayDateOnly(settings?.timezone || 'Asia/Kolkata'));
    const line = `[${day}] ${note}`;
    return existing ? `${existing}\n${line}` : line;
  }

  private async findOrThrow(tenantId: string, id: string) {
    const enquiry = await this.prisma.admissionEnquiry.findFirst({ where: { id, tenantId } });
    if (!enquiry) throw new NotFoundException('Admission enquiry not found');
    return enquiry;
  }
}
