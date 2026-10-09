import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StudentStatus } from '@edurit/database';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { round2, toNumber } from '../../common/utils/money';
import { AcademicYearsService } from '../academic/academic-years.service';
import { BranchesService } from '../academic/branches.service';
import {
  AddGuardianDto,
  CreateStudentDto,
  GuardianInputDto,
  ParentListQueryDto,
  PromoteStudentsDto,
  StudentListQueryDto,
  StudentOptionsQueryDto,
  UpdateEnrollmentDto,
  UpdateStudentDto,
} from './dto/students.dto';

type Tx = Prisma.TransactionClient;

// Synthesised parent logins for guardians without an email end with this.
const PLACEHOLDER_EMAIL_DOMAIN = '@noemail.edurit.local';

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const personName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
const visibleEmail = (email?: string | null) => (email && !email.endsWith(PLACEHOLDER_EMAIL_DOMAIN) ? email : null);

const enrollmentSelect = {
  id: true,
  rollNumber: true,
  academicYearId: true,
  section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
} satisfies Prisma.StudentEnrollmentSelect;

type EnrollmentRow = Prisma.StudentEnrollmentGetPayload<{ select: typeof enrollmentSelect }>;

const mapEnrollment = (e?: EnrollmentRow | null) =>
  e
    ? {
        id: e.id,
        rollNumber: e.rollNumber,
        section: { id: e.section.id, name: e.section.name },
        class: { id: e.section.class.id, name: e.section.class.name },
        sectionLabel: `${e.section.class.name} - ${e.section.name}`,
      }
    : null;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly years: AcademicYearsService,
    private readonly branches: BranchesService,
  ) {}

  // ---------------------------------------------------------------- list
  async list(tenantId: string, query: StudentListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const yearId = await this.resolveYearId(tenantId, query.academicYearId, false);
    const filterBySection = !!(query.sectionId || query.classId);
    if (filterBySection && !yearId) return paginated([], 0, page, limit);

    // Default to ACTIVE; 'ALL' disables the status filter.
    const status = query.status === 'ALL' ? undefined : ((query.status as StudentStatus) ?? StudentStatus.ACTIVE);
    const where: Prisma.StudentWhereInput = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...this.searchWhere(query.search, true),
      ...(filterBySection && {
        enrollments: {
          some: {
            academicYearId: yearId,
            ...(query.sectionId ? { sectionId: query.sectionId } : { section: { classId: query.classId } }),
          },
        },
      }),
    };

    let ids: string[];
    let total: number;
    if (query.sectionId && yearId) {
      // Within a section the natural order is the roll number.
      const enrollmentWhere: Prisma.StudentEnrollmentWhereInput = {
        tenantId,
        academicYearId: yearId,
        sectionId: query.sectionId,
        student: where,
      };
      const [count, rows] = await Promise.all([
        this.prisma.studentEnrollment.count({ where: enrollmentWhere }),
        this.prisma.studentEnrollment.findMany({
          where: enrollmentWhere,
          select: { studentId: true },
          orderBy: [{ rollNumber: { sort: 'asc', nulls: 'last' } }, { student: { firstName: 'asc' } }, { student: { lastName: 'asc' } }],
          skip,
          take,
        }),
      ]);
      total = count;
      ids = rows.map((r) => r.studentId);
    } else {
      const [count, rows] = await Promise.all([
        this.prisma.student.count({ where }),
        this.prisma.student.findMany({
          where,
          select: { id: true },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { admissionNumber: 'asc' }],
          skip,
          take,
        }),
      ]);
      total = count;
      ids = rows.map((r) => r.id);
    }

    if (!ids.length) return paginated([], total, page, limit);

    const students = await this.prisma.student.findMany({
      where: { id: { in: ids }, tenantId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        gender: true,
        dob: true,
        phone: true,
        status: true,
        admissionDate: true,
        enrollments: {
          where: yearId ? { academicYearId: yearId } : { academicYear: { isCurrent: true } },
          select: enrollmentSelect,
          take: 1,
        },
        guardians: {
          orderBy: { isPrimary: 'desc' },
          take: 1,
          select: {
            relationship: true,
            parent: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          },
        },
      },
    });
    const byId = new Map(students.map((s) => [s.id, s]));

    const data = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map(({ enrollments, guardians, ...s }) => {
        const g = guardians[0];
        return {
          ...s,
          name: personName(s),
          enrollment: mapEnrollment(enrollments[0]),
          primaryGuardian: g
            ? { name: personName(g.parent.user), phone: g.parent.user.phone, relationship: g.relationship }
            : null,
        };
      });
    return paginated(data, total, page, limit);
  }

  // ---------------------------------------------------------------- options (shared contract)
  // StudentOption[] = { id, name, admissionNumber, rollNumber, sectionId, sectionLabel }
  async options(tenantId: string, query: StudentOptionsQueryDto) {
    const year = await this.years.current(tenantId);
    if (query.sectionId && !year) return [];

    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: StudentStatus.ACTIVE,
        ...this.searchWhere(query.search, false),
        ...(query.sectionId && { enrollments: { some: { academicYearId: year.id, sectionId: query.sectionId } } }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        enrollments: {
          where: year ? { academicYearId: year.id } : { academicYear: { isCurrent: true } },
          select: enrollmentSelect,
          take: 1,
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      // A section is small; without one cap the list (50 when searching).
      take: query.sectionId ? undefined : query.search?.trim() ? 50 : 500,
    });

    return students
      .map((s) => {
        const e = mapEnrollment(s.enrollments[0]);
        return {
          id: s.id,
          name: personName(s),
          admissionNumber: s.admissionNumber,
          rollNumber: e?.rollNumber ?? null,
          sectionId: e?.section.id ?? null,
          sectionLabel: e?.sectionLabel ?? null,
        };
      })
      .sort((a, b) => {
        if (!query.sectionId && a.sectionLabel !== b.sectionLabel) {
          if (!a.sectionLabel) return 1;
          if (!b.sectionLabel) return -1;
          return naturalCompare(a.sectionLabel, b.sectionLabel);
        }
        const ra = a.rollNumber ?? Number.MAX_SAFE_INTEGER;
        const rb = b.rollNumber ?? Number.MAX_SAFE_INTEGER;
        return ra !== rb ? ra - rb : naturalCompare(a.name, b.name);
      });
  }

  // ---------------------------------------------------------------- profile
  async get(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        enrollments: {
          select: {
            ...enrollmentSelect,
            academicYear: { select: { id: true, name: true, isCurrent: true, startDate: true, endDate: true } },
          },
        },
        guardians: {
          orderBy: { isPrimary: 'desc' },
          include: {
            parent: {
              select: {
                id: true,
                occupation: true,
                user: { select: { firstName: true, lastName: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const enrollments = student.enrollments
      .sort((a, b) => b.academicYear.startDate.getTime() - a.academicYear.startDate.getTime())
      .map((e) => ({
        ...mapEnrollment(e),
        academicYear: { id: e.academicYear.id, name: e.academicYear.name, isCurrent: e.academicYear.isCurrent },
      }));
    const current = student.enrollments.find((e) => e.academicYear.isCurrent);
    const currentYear = current?.academicYear ?? (await this.years.current(tenantId));

    const [attendanceSummary, feeSummary] = await Promise.all([
      this.attendanceSummary(tenantId, id, currentYear),
      this.feeSummary(tenantId, id),
    ]);

    const { enrollments: _e, guardians, ...rest } = student;
    return {
      ...rest,
      name: personName(student),
      currentEnrollment: current ? mapEnrollment(current) : null,
      enrollments,
      guardians: guardians.map((g) => ({
        guardianId: g.id,
        parentId: g.parentId,
        relationship: g.relationship,
        isPrimary: g.isPrimary,
        name: personName(g.parent.user),
        email: visibleEmail(g.parent.user.email),
        phone: g.parent.user.phone,
        occupation: g.parent.occupation,
      })),
      attendanceSummary,
      feeSummary,
    };
  }

  private async attendanceSummary(
    tenantId: string,
    studentId: string,
    year: { startDate: Date; endDate: Date } | null,
  ) {
    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0, percent: 0 };
    if (!year) return summary;
    const groups = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        studentId,
        session: { tenantId, attendanceDate: { gte: year.startDate, lte: year.endDate } },
      },
      _count: { _all: true },
    });
    for (const g of groups) {
      const n = g._count._all;
      if (g.status === 'PRESENT') summary.present = n;
      if (g.status === 'ABSENT') summary.absent = n;
      if (g.status === 'LATE') summary.late = n;
      if (g.status === 'EXCUSED') summary.excused = n;
      summary.total += n;
    }
    // Late still counts as attended.
    summary.percent = summary.total ? round2(((summary.present + summary.late) / summary.total) * 100) : 0;
    return summary;
  }

  private async feeSummary(tenantId: string, studentId: string) {
    const where: Prisma.StudentInvoiceWhereInput = { tenantId, studentId, deletedAt: null, status: { not: 'VOID' } };
    const timezone = await this.timezone(tenantId);
    const [sums, overdueCount] = await Promise.all([
      this.prisma.studentInvoice.aggregate({ where, _sum: { totalAmount: true, paidAmount: true, balanceAmount: true } }),
      this.prisma.studentInvoice.count({
        where: { ...where, balanceAmount: { gt: 0 }, dueDate: { lt: todayDateOnly(timezone) } },
      }),
    ]);
    return {
      totalInvoiced: round2(toNumber(sums._sum.totalAmount)),
      totalPaid: round2(toNumber(sums._sum.paidAmount)),
      balance: round2(toNumber(sums._sum.balanceAmount)),
      overdueCount,
    };
  }

  // ---------------------------------------------------------------- admission
  async create(user: AuthUser, dto: CreateStudentDto) {
    const tenantId = user.tenantId;
    const section = await this.findSectionOrThrow(tenantId, dto.sectionId);
    const year = await this.resolveYear(tenantId, dto.academicYearId);
    const branchId = dto.branchId ? await this.branches.resolveBranchId(tenantId, dto.branchId) : section.class.branchId;
    const timezone = await this.timezone(tenantId);

    await this.assertPlanLimit(tenantId);
    await this.assertCapacity(tenantId, section, year.id);

    const dob = parseDateOnly(dto.dob);
    const admissionDate = dto.admissionDate ? parseDateOnly(dto.admissionDate) : todayDateOnly(timezone);
    if (dob >= admissionDate) throw new BadRequestException('Date of birth must be before the admission date');

    const manualNumber = dto.admissionNumber?.trim();
    if (manualNumber) await this.assertAdmissionNumberFree(tenantId, manualNumber);

    let rollNumber = dto.rollNumber;
    if (rollNumber) await this.assertRollFree(tenantId, section.id, year.id, rollNumber);
    else rollNumber = await this.nextRollNumber(tenantId, section.id, year.id);

    // Hash outside the transaction (bcrypt is slow).
    const passwordHash = dto.guardian ? await this.randomPasswordHash() : null;

    let studentId: string | null = null;
    for (let attempt = 0; attempt < 5 && !studentId; attempt++) {
      const admissionNumber = manualNumber || (await this.generateAdmissionNumber(tenantId, admissionDate, attempt));
      try {
        studentId = await this.prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              tenantId,
              branchId,
              admissionNumber,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName?.trim() ?? '',
              dob,
              gender: dto.gender,
              bloodGroup: dto.bloodGroup,
              phone: dto.phone,
              email: dto.email?.toLowerCase(),
              address: dto.address,
              admissionDate,
              status: StudentStatus.ACTIVE,
            },
          });
          await tx.studentEnrollment.create({
            data: { tenantId, studentId: student.id, academicYearId: year.id, sectionId: section.id, rollNumber },
          });
          if (dto.guardian) {
            const parentId = await this.ensureParent(tx, tenantId, dto.guardian, passwordHash);
            await tx.studentGuardian.create({
              data: { studentId: student.id, parentId, relationship: dto.guardian.relationship, isPrimary: true },
            });
          }
          await this.audit.log(
            user,
            'CREATE',
            'Student',
            student.id,
            { admissionNumber, name: personName(student), sectionId: section.id, academicYearId: year.id, rollNumber },
            tx,
          );
          return student.id;
        });
      } catch (error) {
        // Auto-generated number collided with a concurrent admission: try the next one.
        const collided =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          String(error.meta?.target ?? '').includes('admission_number');
        if (!manualNumber && collided) continue;
        throw error;
      }
    }
    if (!studentId) throw new ConflictException('Could not generate a unique admission number, please try again');
    return this.get(tenantId, studentId);
  }

  // ---------------------------------------------------------------- update / delete
  async update(user: AuthUser, id: string, dto: UpdateStudentDto) {
    const student = await this.findOrThrow(user.tenantId, id);
    const admissionNumber = dto.admissionNumber?.trim();
    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      await this.assertAdmissionNumberFree(user.tenantId, admissionNumber);
    }
    const branchId = dto.branchId ? await this.branches.resolveBranchId(user.tenantId, dto.branchId) : undefined;
    const dob = dto.dob ? parseDateOnly(dto.dob) : undefined;
    const admissionDate = dto.admissionDate ? parseDateOnly(dto.admissionDate) : undefined;
    if ((dob ?? student.dob) >= (admissionDate ?? student.admissionDate)) {
      throw new BadRequestException('Date of birth must be before the admission date');
    }
    if (dto.status === StudentStatus.ACTIVE && student.status !== StudentStatus.ACTIVE) {
      await this.assertPlanLimit(user.tenantId);
    }

    await this.prisma.student.update({
      where: { id },
      data: {
        admissionNumber: admissionNumber || undefined,
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
        dob,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        // null (sent by the edit form for an emptied field) clears the value
        phone: dto.phone,
        email: dto.email === null ? null : dto.email?.toLowerCase(),
        address: dto.address,
        admissionDate,
        branchId,
        status: dto.status as StudentStatus | undefined,
      },
    });
    await this.audit.log(user, 'UPDATE', 'Student', id, { ...dto });
    return this.get(user.tenantId, id);
  }

  // Soft delete. The admission number is suffixed so it can be reused
  // (it is unique per tenant).
  async remove(user: AuthUser, id: string) {
    const student = await this.findOrThrow(user.tenantId, id);
    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        admissionNumber: `${student.admissionNumber}~${Date.now().toString(36)}`.slice(0, 64),
      },
    });
    await this.audit.log(user, 'DELETE', 'Student', id, {
      admissionNumber: student.admissionNumber,
      name: personName(student),
    });
    return { id, deleted: true };
  }

  // ---------------------------------------------------------------- enrollment
  async setEnrollment(user: AuthUser, id: string, dto: UpdateEnrollmentDto) {
    const tenantId = user.tenantId;
    const student = await this.findOrThrow(tenantId, id);
    const section = await this.findSectionOrThrow(tenantId, dto.sectionId);
    const year = await this.resolveYear(tenantId, dto.academicYearId);

    const existing = await this.prisma.studentEnrollment.findUnique({
      where: { tenantId_studentId_academicYearId: { tenantId, studentId: id, academicYearId: year.id } },
    });
    const sameSection = existing?.sectionId === section.id;
    if (!sameSection) await this.assertCapacity(tenantId, section, year.id);

    let rollNumber = dto.rollNumber;
    if (rollNumber) {
      if (!(sameSection && existing?.rollNumber === rollNumber)) {
        await this.assertRollFree(tenantId, section.id, year.id, rollNumber, id);
      }
    } else {
      rollNumber = sameSection && existing?.rollNumber ? existing.rollNumber : await this.nextRollNumber(tenantId, section.id, year.id);
    }

    await this.prisma.studentEnrollment.upsert({
      where: { tenantId_studentId_academicYearId: { tenantId, studentId: id, academicYearId: year.id } },
      create: { tenantId, studentId: id, academicYearId: year.id, sectionId: section.id, rollNumber },
      update: { sectionId: section.id, rollNumber },
    });
    await this.audit.log(user, existing ? 'UPDATE' : 'CREATE', 'StudentEnrollment', id, {
      student: personName(student),
      academicYear: year.name,
      fromSectionId: existing?.sectionId ?? null,
      toSectionId: section.id,
      rollNumber,
    });
    return this.get(tenantId, id);
  }

  async promote(user: AuthUser, dto: PromoteStudentsDto) {
    const tenantId = user.tenantId;
    const [fromSection, toSection] = await Promise.all([
      this.findSectionOrThrow(tenantId, dto.fromSectionId),
      this.findSectionOrThrow(tenantId, dto.toSectionId),
    ]);
    const fromYear = await this.resolveYear(tenantId, dto.fromAcademicYearId);
    const toYear = await this.resolveYear(tenantId, dto.toAcademicYearId);
    if (fromYear.id === toYear.id) {
      throw new BadRequestException('Choose a different academic year to promote into. Use "Change section" to move within a year.');
    }

    const sourceEnrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId,
        academicYearId: fromYear.id,
        sectionId: fromSection.id,
        student: { deletedAt: null, status: StudentStatus.ACTIVE },
        ...(dto.studentIds?.length && { studentId: { in: dto.studentIds } }),
      },
      select: { studentId: true, rollNumber: true },
      orderBy: [{ rollNumber: { sort: 'asc', nulls: 'last' } }, { student: { firstName: 'asc' } }],
    });
    if (!sourceEnrollments.length) {
      throw new BadRequestException(`No active students found in ${fromSection.class.name} - ${fromSection.name} for ${fromYear.name}`);
    }

    const [alreadyEnrolled, targetRows] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where: { tenantId, academicYearId: toYear.id, studentId: { in: sourceEnrollments.map((e) => e.studentId) } },
        select: { studentId: true },
      }),
      this.prisma.studentEnrollment.findMany({
        where: { tenantId, academicYearId: toYear.id, sectionId: toSection.id, student: { deletedAt: null } },
        select: { rollNumber: true, student: { select: { status: true } } },
      }),
    ]);
    const skip = new Set(alreadyEnrolled.map((e) => e.studentId));
    const toPromote = sourceEnrollments.filter((e) => !skip.has(e.studentId));

    const activeInTarget = targetRows.filter((r) => r.student.status === StudentStatus.ACTIVE).length;
    if (toPromote.length && activeInTarget + toPromote.length > toSection.capacity) {
      throw new BadRequestException(
        `${toSection.class.name} - ${toSection.name} can hold ${toSection.capacity} students; it already has ${activeInTarget} and ${toPromote.length} would be added. Increase the capacity or promote fewer students.`,
      );
    }

    // Keep roll numbers when free in the target section, otherwise append.
    const taken = new Set(targetRows.map((r) => r.rollNumber).filter((n): n is number => n != null));
    const wanted = new Set<number>();
    let next = Math.max(0, ...taken, ...toPromote.map((e) => e.rollNumber ?? 0)) + 1;
    const data = toPromote.map((e) => {
      let roll = e.rollNumber;
      if (roll == null || taken.has(roll) || wanted.has(roll)) roll = next++;
      wanted.add(roll);
      return { tenantId, studentId: e.studentId, academicYearId: toYear.id, sectionId: toSection.id, rollNumber: roll };
    });

    if (data.length) {
      await this.prisma.$transaction(async (tx) => {
        await tx.studentEnrollment.createMany({ data, skipDuplicates: true });
        await this.audit.log(
          user,
          'PROMOTE',
          'StudentEnrollment',
          null,
          {
            from: `${fromSection.class.name} - ${fromSection.name} (${fromYear.name})`,
            to: `${toSection.class.name} - ${toSection.name} (${toYear.name})`,
            promoted: data.length,
            skipped: skip.size,
          },
          tx,
        );
      });
    }

    return {
      promoted: data.length,
      skipped: skip.size,
      toSectionLabel: `${toSection.class.name} - ${toSection.name}`,
      toAcademicYear: toYear.name,
    };
  }

  // ---------------------------------------------------------------- guardians
  async addGuardian(user: AuthUser, studentId: string, dto: AddGuardianDto) {
    const tenantId = user.tenantId;
    await this.findOrThrow(tenantId, studentId);

    let parentId = dto.parentId;
    if (parentId) {
      const parent = await this.prisma.parent.findFirst({ where: { id: parentId, tenantId, deletedAt: null } });
      if (!parent) throw new NotFoundException('Parent not found');
    } else if (!dto.firstName || !dto.phone) {
      throw new BadRequestException('Choose an existing parent or enter the guardian’s first name and phone');
    }

    const passwordHash = parentId ? null : await this.randomPasswordHash();
    await this.prisma.$transaction(async (tx) => {
      if (!parentId) {
        parentId = await this.ensureParent(
          tx,
          tenantId,
          {
            firstName: dto.firstName,
            lastName: dto.lastName,
            relationship: dto.relationship,
            phone: dto.phone,
            email: dto.email,
            occupation: dto.occupation,
          },
          passwordHash,
        );
      }
      const existing = await tx.studentGuardian.findUnique({ where: { studentId_parentId: { studentId, parentId } } });
      if (existing) throw new ConflictException('This person is already a guardian of the student');

      const count = await tx.studentGuardian.count({ where: { studentId } });
      const isPrimary = !!dto.isPrimary || count === 0;
      if (isPrimary) await tx.studentGuardian.updateMany({ where: { studentId }, data: { isPrimary: false } });
      const guardian = await tx.studentGuardian.create({
        data: { studentId, parentId, relationship: dto.relationship, isPrimary },
      });
      await this.audit.log(user, 'CREATE', 'StudentGuardian', guardian.id, { studentId, parentId, relationship: dto.relationship, isPrimary }, tx);
    });
    return this.get(tenantId, studentId);
  }

  async removeGuardian(user: AuthUser, studentId: string, guardianId: string) {
    await this.findOrThrow(user.tenantId, studentId);
    const guardian = await this.prisma.studentGuardian.findFirst({ where: { id: guardianId, studentId } });
    if (!guardian) throw new NotFoundException('Guardian not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.studentGuardian.delete({ where: { id: guardianId } });
      if (guardian.isPrimary) {
        const next = await tx.studentGuardian.findFirst({ where: { studentId }, select: { id: true } });
        if (next) await tx.studentGuardian.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
      await this.audit.log(user, 'DELETE', 'StudentGuardian', guardianId, { studentId, parentId: guardian.parentId }, tx);
    });
    return { id: guardianId, deleted: true };
  }

  // ---------------------------------------------------------------- parents
  async listParents(tenantId: string, query: ParentListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const term = query.search?.trim();
    const where: Prisma.ParentWhereInput = {
      tenantId,
      deletedAt: null,
      ...(term && {
        user: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term } },
          ],
        },
      }),
    };
    const [total, parents] = await Promise.all([
      this.prisma.parent.count({ where }),
      this.prisma.parent.findMany({
        where,
        skip,
        take,
        orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
        select: {
          id: true,
          occupation: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          children: {
            where: { student: { deletedAt: null } },
            select: {
              relationship: true,
              isPrimary: true,
              student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
            },
          },
        },
      }),
    ]);
    const data = parents.map((p) => ({
      id: p.id,
      occupation: p.occupation,
      name: personName(p.user),
      user: { ...p.user, email: visibleEmail(p.user.email) },
      children: p.children.map((c) => ({
        id: c.student.id,
        name: personName(c.student),
        admissionNumber: c.student.admissionNumber,
        relationship: c.relationship,
        isPrimary: c.isPrimary,
      })),
    }));
    return paginated(data, total, page, limit);
  }

  // ---------------------------------------------------------------- helpers
  private searchWhere(search: string | undefined, includePhone: boolean): Prisma.StudentWhereInput {
    const term = search?.trim();
    if (!term) return {};
    const or: Prisma.StudentWhereInput[] = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { admissionNumber: { contains: term, mode: 'insensitive' } },
    ];
    if (includePhone) or.push({ phone: { contains: term } });
    // "Aarav Sharma" → first + last name
    const parts = term.split(/\s+/);
    if (parts.length > 1) {
      or.push({
        AND: [
          { firstName: { contains: parts[0], mode: 'insensitive' } },
          { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' } },
        ],
      });
    }
    return { OR: or };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  private async findSectionOrThrow(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId, deletedAt: null, class: { deletedAt: null } },
      include: { class: { select: { id: true, name: true, branchId: true } } },
    });
    if (!section) throw new NotFoundException('Section not found. Check the class & section in Academic Setup.');
    return section;
  }

  private async resolveYear(tenantId: string, academicYearId?: string) {
    if (!academicYearId) return this.years.requireCurrent(tenantId);
    const year = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId, deletedAt: null } });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  private async resolveYearId(tenantId: string, academicYearId: string | undefined, required: boolean) {
    if (academicYearId) return (await this.resolveYear(tenantId, academicYearId)).id;
    const current = required ? await this.years.requireCurrent(tenantId) : await this.years.current(tenantId);
    return current?.id ?? null;
  }

  private async timezone(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return settings?.timezone || 'Asia/Kolkata';
  }

  private async assertPlanLimit(tenantId: string) {
    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { name: true, maxStudents: true } } },
    });
    if (!subscription?.plan) return;
    const active = await this.prisma.student.count({
      where: { tenantId, deletedAt: null, status: StudentStatus.ACTIVE },
    });
    if (active >= subscription.plan.maxStudents) {
      throw new BadRequestException(
        `Your ${subscription.plan.name} plan allows ${subscription.plan.maxStudents} active students and you already have ${active}. Upgrade the plan or archive inactive students to admit more.`,
      );
    }
  }

  private async assertCapacity(
    tenantId: string,
    section: { id: string; name: string; capacity: number; class: { name: string } },
    academicYearId: string,
  ) {
    const enrolled = await this.prisma.studentEnrollment.count({
      where: {
        tenantId,
        academicYearId,
        sectionId: section.id,
        student: { deletedAt: null, status: StudentStatus.ACTIVE },
      },
    });
    if (enrolled >= section.capacity) {
      throw new BadRequestException(
        `${section.class.name} - ${section.name} is full (${enrolled}/${section.capacity}). Choose another section or increase its capacity in Academic Setup.`,
      );
    }
  }

  private async assertAdmissionNumberFree(tenantId: string, admissionNumber: string) {
    const clash = await this.prisma.student.findUnique({
      where: { tenantId_admissionNumber: { tenantId, admissionNumber } },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`Admission number ${admissionNumber} is already in use`);
  }

  private async assertRollFree(
    tenantId: string,
    sectionId: string,
    academicYearId: string,
    rollNumber: number,
    exceptStudentId?: string,
  ) {
    const clash = await this.prisma.studentEnrollment.findFirst({
      where: {
        tenantId,
        sectionId,
        academicYearId,
        rollNumber,
        student: { deletedAt: null },
        ...(exceptStudentId && { studentId: { not: exceptStudentId } }),
      },
      select: { student: { select: { firstName: true, lastName: true } } },
    });
    if (clash) {
      throw new BadRequestException(`Roll number ${rollNumber} is already taken by ${personName(clash.student)} in this section`);
    }
  }

  private async nextRollNumber(tenantId: string, sectionId: string, academicYearId: string) {
    const max = await this.prisma.studentEnrollment.aggregate({
      where: { tenantId, sectionId, academicYearId, student: { deletedAt: null } },
      _max: { rollNumber: true },
    });
    return (max._max.rollNumber ?? 0) + 1;
  }

  // ADM-<yyyy>-<0001>, incrementing per tenant and year. Soft-deleted numbers
  // ("ADM-2026-0005~xyz") still count so numbers are never reissued.
  private async generateAdmissionNumber(tenantId: string, admissionDate: Date, attempt: number) {
    const prefix = `ADM-${admissionDate.getUTCFullYear()}-`;
    const rows = await this.prisma.student.findMany({
      where: { tenantId, admissionNumber: { startsWith: prefix } },
      select: { admissionNumber: true },
    });
    const max = rows.reduce((acc, r) => {
      const n = parseInt(r.admissionNumber.slice(prefix.length), 10);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `${prefix}${String(max + 1 + attempt).padStart(4, '0')}`;
  }

  private async randomPasswordHash() {
    return bcrypt.hash(randomBytes(24).toString('hex'), 10);
  }

  // Find-or-create the parent's login (User), their membership with the PARENT
  // role in this school, and the Parent profile. Returns Parent.id.
  private async ensureParent(tx: Tx, tenantId: string, guardian: GuardianInputDto, passwordHash: string | null) {
    const phone = guardian.phone?.trim() ?? '';
    const phoneDigits = phone.replace(/\D/g, '');
    const email =
      guardian.email?.trim().toLowerCase() ||
      (phoneDigits ? `parent.${phoneDigits}.${tenantId.replace(/-/g, '').slice(0, 8)}${PLACEHOLDER_EMAIL_DOMAIN}` : '');
    if (!email) throw new BadRequestException('Guardian needs a phone number or an email');

    let user = await tx.user.findUnique({ where: { email } });
    if (user?.deletedAt) {
      throw new BadRequestException(`The account ${email} has been deactivated. Use a different email for the guardian.`);
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          phone: phone || null,
          firstName: guardian.firstName.trim(),
          lastName: guardian.lastName?.trim() ?? '',
          passwordHash: passwordHash ?? (await this.randomPasswordHash()),
        },
      });
    } else if (!user.phone && phone) {
      user = await tx.user.update({ where: { id: user.id }, data: { phone } });
    }

    const membership = await tx.membership.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      create: { tenantId, userId: user.id, status: 'ACTIVE' },
      update: {},
    });
    if (membership.status === 'INVITED') {
      await tx.membership.update({ where: { id: membership.id }, data: { status: 'ACTIVE' } });
    }
    const parentRole = await tx.role.findUnique({
      where: { tenantId_code: { tenantId, code: 'PARENT' } },
      select: { id: true },
    });
    if (parentRole) {
      await tx.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId: parentRole.id } },
        create: { membershipId: membership.id, roleId: parentRole.id },
        update: {},
      });
    }

    const parent = await tx.parent.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      create: { tenantId, userId: user.id, occupation: guardian.occupation },
      update: { deletedAt: null, ...(guardian.occupation && { occupation: guardian.occupation }) },
    });
    return parent.id;
  }
}
