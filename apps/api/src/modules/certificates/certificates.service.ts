import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { round2, toNumber } from '../../common/utils/money';
import { AcademicYearsService } from '../academic/academic-years.service';
import {
  CertificateListQueryDto,
  CertificatePreviewQueryDto,
  CertificateType,
  IdCardsQueryDto,
  IssueCertificateDto,
  IssueIdCardsDto,
  RevokeCertificateDto,
} from './dto/certificates.dto';

type Tx = Prisma.TransactionClient;
type JsonObject = Record<string, unknown>;

export const CERTIFICATE_TITLES: Record<CertificateType, string> = {
  TC: 'Transfer Certificate',
  BONAFIDE: 'Bonafide Certificate',
  CHARACTER: 'Character Certificate',
  ID_CARD: 'Student Identity Card',
};

// Fields of TenantSettings.themeConfig.profile (see modules/tenants).
const PROFILE_FIELDS = [
  'address',
  'city',
  'state',
  'pincode',
  'phone',
  'email',
  'website',
  'affiliationBoard',
  'affiliationNumber',
  'principalName',
  'establishedYear',
] as const;
type SchoolProfile = Record<(typeof PROFILE_FIELDS)[number], string>;

// Synthesised parent logins for guardians without an email (students module).
const PLACEHOLDER_EMAIL_DOMAIN = '@noemail.edurit.local';
const PASS_PERCENT = 33;

const isPlainObject = (value: unknown): value is JsonObject => !!value && typeof value === 'object' && !Array.isArray(value);
const personName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
const dateOnly = (d: Date | null | undefined) => (d ? formatDateOnly(d) : null);
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;

const guardianSelect = {
  relationship: true,
  isPrimary: true,
  parent: {
    select: {
      occupation: true,
      deletedAt: true,
      user: { select: { firstName: true, lastName: true, phone: true, email: true } },
    },
  },
} satisfies Prisma.StudentGuardianSelect;

const enrollmentSelect = {
  rollNumber: true,
  academicYear: { select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true } },
  section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
} satisfies Prisma.StudentEnrollmentSelect;

const studentSelect = {
  id: true,
  admissionNumber: true,
  firstName: true,
  lastName: true,
  dob: true,
  gender: true,
  bloodGroup: true,
  phone: true,
  email: true,
  address: true,
  photoUrl: true,
  admissionDate: true,
  status: true,
  guardians: { select: guardianSelect },
} satisfies Prisma.StudentSelect;

type StudentRow = Prisma.StudentGetPayload<{ select: typeof studentSelect }>;
type EnrollmentRow = Prisma.StudentEnrollmentGetPayload<{ select: typeof enrollmentSelect }>;

export interface SchoolBlock extends SchoolProfile {
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  fullAddress: string;
}

export interface CertificateSnapshot {
  school: SchoolBlock;
  student: ReturnType<typeof toStudentBlock>;
  enrollment: ReturnType<typeof toEnrollmentBlock>;
  attendance: { academicYear: string; present: number; total: number; percent: number | null } | null;
  lastExam: { examName: string; academicYear: string; percent: number; grade: string; result: string } | null;
  generatedAt: string;
}

function toStudentBlock(s: StudentRow) {
  const guardians = s.guardians
    .filter((g) => !g.parent.deletedAt)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const byRelation = (rel: string) => guardians.find((g) => g.relationship.toUpperCase() === rel);
  const nameOf = (g?: (typeof guardians)[number]) => (g ? personName(g.parent.user) : null);
  const primary = guardians[0];
  const guardian = byRelation('GUARDIAN') ?? primary;
  const withPhone = guardians.find((g) => g.parent.user.phone);
  return {
    id: s.id,
    name: personName(s),
    firstName: s.firstName,
    lastName: s.lastName,
    admissionNumber: s.admissionNumber,
    dob: dateOnly(s.dob),
    gender: s.gender,
    bloodGroup: s.bloodGroup,
    photoUrl: s.photoUrl,
    address: s.address,
    phone: s.phone,
    email: s.email,
    admissionDate: dateOnly(s.admissionDate),
    status: s.status,
    fatherName: nameOf(byRelation('FATHER')),
    motherName: nameOf(byRelation('MOTHER')),
    guardianName: nameOf(guardian),
    guardianRelationship: guardian?.relationship ?? null,
    guardianPhone: primary?.parent.user.phone || withPhone?.parent.user.phone || s.phone || null,
    guardianEmail:
      primary?.parent.user.email && !primary.parent.user.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)
        ? primary.parent.user.email
        : null,
  };
}

function toEnrollmentBlock(e: EnrollmentRow | null | undefined) {
  if (!e) return null;
  return {
    academicYearId: e.academicYear.id,
    academicYear: e.academicYear.name,
    isCurrentYear: e.academicYear.isCurrent,
    classId: e.section.class.id,
    className: e.section.class.name,
    sectionId: e.section.id,
    sectionName: e.section.name,
    label: `${e.section.class.name} - ${e.section.name}`,
    rollNumber: e.rollNumber,
  };
}

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly years: AcademicYearsService,
  ) {}

  // ---------------------------------------------------------------- register

  async list(user: AuthUser, query: CertificateListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const term = query.search?.trim();
    const parts = term ? term.split(/\s+/) : [];
    const where: Prisma.IssuedCertificateWhereInput = {
      tenantId: user.tenantId,
      ...(query.type && { type: query.type }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(term && {
        OR: [
          { serialNumber: { contains: term, mode: 'insensitive' } },
          { student: { admissionNumber: { contains: term, mode: 'insensitive' } } },
          { student: { firstName: { contains: term, mode: 'insensitive' } } },
          { student: { lastName: { contains: term, mode: 'insensitive' } } },
          ...(parts.length > 1
            ? [
                {
                  student: {
                    firstName: { contains: parts[0], mode: 'insensitive' as const },
                    lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' as const },
                  },
                },
              ]
            : []),
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.issuedCertificate.findMany({
        where,
        include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, status: true } } },
        orderBy: [{ issuedAt: 'desc' }, { serialNumber: 'desc' }],
        skip,
        take,
      }),
      this.prisma.issuedCertificate.count({ where }),
    ]);

    const issuers = await this.userNames(rows.map((r) => r.issuedById));
    return paginated(
      rows.map((r) => this.mapRow(r, issuers)),
      total,
      page,
      limit,
    );
  }

  async get(user: AuthUser, id: string) {
    const row = await this.prisma.issuedCertificate.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, status: true } } },
    });
    if (!row) throw new NotFoundException('Certificate not found');
    const issuers = await this.userNames([row.issuedById]);
    return { ...this.mapRow(row, issuers), snapshot: this.splitData(row.data).snapshot ?? null };
  }

  // ---------------------------------------------------------------- preview / issue

  async preview(user: AuthUser, query: CertificatePreviewQueryDto) {
    const student = await this.findStudentOrThrow(user.tenantId, query.studentId);
    const [snapshot, tz, existingTc] = await Promise.all([
      this.buildSnapshot(user.tenantId, student, query.type === 'TC'),
      this.timezone(user.tenantId),
      query.type === 'TC' ? this.activeTc(user.tenantId, student.id) : null,
    ]);

    const warnings: string[] = [];
    if (student.status !== 'ACTIVE') warnings.push(`Student status is ${student.status}.`);
    if (existingTc) warnings.push(`Transfer Certificate ${existingTc.serialNumber} has already been issued to this student.`);
    if (!snapshot.enrollment) warnings.push('Student has no class enrollment on record.');

    return {
      type: query.type,
      title: CERTIFICATE_TITLES[query.type],
      issueDate: formatDateOnly(todayDateOnly(tz)),
      warnings,
      ...snapshot,
    };
  }

  async issue(user: AuthUser, dto: IssueCertificateDto) {
    const student = await this.findStudentOrThrow(user.tenantId, dto.studentId);
    const input = Object.fromEntries(
      Object.entries(dto.data ?? {}).filter(([, v]) => typeof v === 'string' && v.trim() !== ''),
    ) as Record<string, string>;
    const tz = await this.timezone(user.tenantId);
    const today = todayDateOnly(tz);

    if (dto.type === 'TC') {
      if (!input.leavingDate) throw new BadRequestException('Date of leaving is required for a Transfer Certificate');
      if (!input.reason) throw new BadRequestException('Reason for leaving is required for a Transfer Certificate');
      if (parseDateOnly(input.leavingDate) < student.admissionDate) {
        throw new BadRequestException('Date of leaving cannot be before the admission date');
      }
      const existing = await this.activeTc(user.tenantId, student.id);
      if (existing) {
        throw new BadRequestException(
          `Transfer Certificate ${existing.serialNumber} was already issued to this student. Revoke it before issuing a new one.`,
        );
      }
    }
    if (dto.type === 'BONAFIDE' && !input.purpose) input.purpose = 'General purpose';
    if (input.validUpto) parseDateOnly(input.validUpto);

    const snapshot = await this.buildSnapshot(user.tenantId, student, dto.type === 'TC');
    if (dto.type === 'ID_CARD' && !input.validUpto) {
      const year = await this.years.current(user.tenantId);
      if (year) input.validUpto = formatDateOnly(year.endDate);
    }
    const year = today.getUTCFullYear();

    const created = await this.withSerialRetry(() =>
      this.prisma.$transaction(async (tx) => {
        const [serialNumber] = await this.nextSerials(tx, user.tenantId, dto.type, year, 1);
        let statusChanged = false;
        if (dto.type === 'TC') {
          const res = await tx.student.updateMany({
            where: { id: student.id, tenantId: user.tenantId, status: 'ACTIVE' },
            data: { status: 'TRANSFERRED' },
          });
          statusChanged = res.count > 0;
        }
        const cert = await tx.issuedCertificate.create({
          data: {
            tenantId: user.tenantId,
            studentId: student.id,
            type: dto.type,
            serialNumber,
            issuedById: user.id,
            data: toJson({
              ...input,
              issueDate: formatDateOnly(today),
              ...(dto.type === 'TC' && { studentStatusChanged: statusChanged, previousStatus: student.status }),
              snapshot,
            }),
          },
        });
        await this.audit.log(
          user,
          'ISSUE',
          'IssuedCertificate',
          cert.id,
          {
            type: dto.type,
            serialNumber,
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            ...(statusChanged && { studentStatus: { from: student.status, to: 'TRANSFERRED' } }),
          },
          tx,
        );
        return cert;
      }),
    );

    return this.get(user, created.id);
  }

  async revoke(user: AuthUser, id: string, dto: RevokeCertificateDto) {
    const cert = await this.prisma.issuedCertificate.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!cert) throw new NotFoundException('Certificate not found');
    if (cert.revokedAt) throw new BadRequestException('This certificate has already been revoked');

    const revokedAt = new Date();
    const data = isPlainObject(cert.data) ? cert.data : {};
    await this.prisma.issuedCertificate.update({
      where: { id },
      data: {
        revokedAt,
        data: toJson({
          ...data,
          revocation: {
            reason: dto.reason.trim(),
            revokedAt: revokedAt.toISOString(),
            revokedById: user.id,
            revokedByName: `${user.firstName} ${user.lastName}`.trim(),
          },
        }),
      },
    });
    // A revoked TC does not reactivate the student; the status is left as is.
    await this.audit.log(user, 'REVOKE', 'IssuedCertificate', id, {
      type: cert.type,
      serialNumber: cert.serialNumber,
      reason: dto.reason.trim(),
    });
    return this.get(user, id);
  }

  // ---------------------------------------------------------------- ID cards

  async idCards(user: AuthUser, query: IdCardsQueryDto) {
    const { section, year, enrollments } = await this.sectionStudents(user.tenantId, query.sectionId);
    const [school, existing] = await Promise.all([
      this.schoolBlock(user.tenantId),
      this.prisma.issuedCertificate.findMany({
        where: {
          tenantId: user.tenantId,
          type: 'ID_CARD',
          revokedAt: null,
          studentId: { in: enrollments.map((e) => e.student.id) },
        },
        orderBy: { issuedAt: 'desc' },
        select: { id: true, studentId: true, serialNumber: true, issuedAt: true, data: true },
      }),
    ]);

    const latest = new Map<string, (typeof existing)[number]>();
    existing.forEach((c) => !latest.has(c.studentId) && latest.set(c.studentId, c));

    return {
      school,
      section: { id: section.id, label: `${section.class.name} - ${section.name}` },
      academicYear: { id: year.id, name: year.name, endDate: dateOnly(year.endDate) },
      defaultValidUpto: dateOnly(year.endDate),
      students: enrollments.map((e) => {
        const s = toStudentBlock(e.student);
        const card = latest.get(s.id);
        const cardData = card && isPlainObject(card.data) ? card.data : {};
        return {
          studentId: s.id,
          name: s.name,
          admissionNumber: s.admissionNumber,
          classSection: `${section.class.name} - ${section.name}`,
          rollNumber: e.rollNumber,
          dob: s.dob,
          gender: s.gender,
          bloodGroup: s.bloodGroup,
          photoUrl: s.photoUrl,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          address: s.address,
          issued: card
            ? {
                id: card.id,
                serialNumber: card.serialNumber,
                issuedAt: card.issuedAt,
                validUpto: typeof cardData.validUpto === 'string' ? cardData.validUpto : null,
              }
            : null,
        };
      }),
    };
  }

  async issueIdCards(user: AuthUser, dto: IssueIdCardsDto) {
    const validUpto = parseDateOnly(dto.validUpto);
    const tz = await this.timezone(user.tenantId);
    const today = todayDateOnly(tz);
    if (validUpto < today) throw new BadRequestException('Valid-upto date cannot be in the past');

    const { section, year, enrollments } = await this.sectionStudents(user.tenantId, dto.sectionId);
    if (!enrollments.length) throw new BadRequestException('This section has no active students');

    const already = await this.prisma.issuedCertificate.findMany({
      where: {
        tenantId: user.tenantId,
        type: 'ID_CARD',
        revokedAt: null,
        studentId: { in: enrollments.map((e) => e.student.id) },
        data: { path: ['validUpto'], equals: dto.validUpto },
      },
      select: { studentId: true },
    });
    const skip = new Set(already.map((c) => c.studentId));
    const pending = enrollments.filter((e) => !skip.has(e.student.id));
    if (!pending.length) {
      return { created: 0, skipped: enrollments.length, validUpto: dto.validUpto, serialNumbers: [] as string[] };
    }

    const school = await this.schoolBlock(user.tenantId);
    const generatedAt = new Date().toISOString();
    const serialNumbers = await this.withSerialRetry(() =>
      this.prisma.$transaction(async (tx) => {
        const serials = await this.nextSerials(tx, user.tenantId, 'ID_CARD', today.getUTCFullYear(), pending.length);
        await tx.issuedCertificate.createMany({
          data: pending.map((e, i) => {
            const snapshot: CertificateSnapshot = {
              school,
              student: toStudentBlock(e.student),
              enrollment: toEnrollmentBlock({ rollNumber: e.rollNumber, academicYear: year, section }),
              attendance: null,
              lastExam: null,
              generatedAt,
            };
            return {
              tenantId: user.tenantId,
              studentId: e.student.id,
              type: 'ID_CARD',
              serialNumber: serials[i],
              issuedById: user.id,
              data: toJson({ validUpto: dto.validUpto, issueDate: formatDateOnly(today), snapshot }),
            };
          }),
        });
        await this.audit.log(
          user,
          'ISSUE_ID_CARDS',
          'IssuedCertificate',
          null,
          { sectionId: section.id, validUpto: dto.validUpto, count: pending.length, from: serials[0], to: serials[serials.length - 1] },
          tx,
        );
        return serials;
      }),
    );

    return { created: pending.length, skipped: skip.size, validUpto: dto.validUpto, serialNumbers };
  }

  // ---------------------------------------------------------------- helpers

  private async buildSnapshot(tenantId: string, student: StudentRow, withLastExam: boolean): Promise<CertificateSnapshot> {
    const [school, enrollments, currentYear] = await Promise.all([
      this.schoolBlock(tenantId),
      this.prisma.studentEnrollment.findMany({
        where: { tenantId, studentId: student.id, academicYear: { deletedAt: null } },
        select: enrollmentSelect,
        orderBy: { academicYear: { startDate: 'desc' } },
      }),
      this.years.current(tenantId),
    ]);
    // Current-year enrollment, otherwise the most recent one.
    const enrollment = enrollments.find((e) => e.academicYear.isCurrent) ?? enrollments[0] ?? null;
    const attendanceYear = currentYear ?? enrollment?.academicYear ?? null;

    const [attendance, lastExam] = await Promise.all([
      attendanceYear ? this.attendanceSummary(tenantId, student.id, attendanceYear) : null,
      withLastExam ? this.lastExamResult(tenantId, student.id) : null,
    ]);

    return {
      school,
      student: toStudentBlock(student),
      enrollment: toEnrollmentBlock(enrollment),
      attendance,
      lastExam,
      generatedAt: new Date().toISOString(),
    };
  }

  // Daily (period 0) attendance for the year: present = PRESENT + LATE.
  private async attendanceSummary(
    tenantId: string,
    studentId: string,
    year: { name: string; startDate: Date; endDate: Date },
  ) {
    const groups = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        studentId,
        session: { tenantId, periodNumber: 0, attendanceDate: { gte: year.startDate, lte: year.endDate } },
      },
      _count: { _all: true },
    });
    const total = groups.reduce((sum, g) => sum + g._count._all, 0);
    const present = groups
      .filter((g) => g.status === 'PRESENT' || g.status === 'LATE')
      .reduce((sum, g) => sum + g._count._all, 0);
    return { academicYear: year.name, present, total, percent: total ? round2((present / total) * 100) : null };
  }

  private async lastExamResult(tenantId: string, studentId: string) {
    const card = await this.prisma.reportCard.findFirst({
      where: { tenantId, studentId, exam: { deletedAt: null } },
      orderBy: [{ exam: { endDate: 'desc' } }, { generatedAt: 'desc' }],
      select: {
        overallPercent: true,
        grade: true,
        exam: { select: { name: true, academicYear: { select: { name: true } } } },
      },
    });
    if (!card) return null;
    const percent = toNumber(card.overallPercent);
    return {
      examName: card.exam.name,
      academicYear: card.exam.academicYear.name,
      percent,
      grade: card.grade,
      result: percent >= PASS_PERCENT ? 'Passed' : 'Not passed',
    };
  }

  private async schoolBlock(tenantId: string): Promise<SchoolBlock> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { name: true, legalName: true, settings: { select: { logoUrl: true, themeConfig: true } } },
    });
    if (!tenant) throw new NotFoundException('School not found');
    const theme = isPlainObject(tenant.settings?.themeConfig) ? tenant.settings.themeConfig : {};
    const stored = isPlainObject(theme.profile) ? theme.profile : {};
    const profile = Object.fromEntries(
      PROFILE_FIELDS.map((f) => [f, typeof stored[f] === 'string' ? (stored[f] as string) : '']),
    ) as SchoolProfile;
    const cityLine = [profile.city, profile.state].filter(Boolean).join(', ');
    return {
      name: tenant.name,
      legalName: tenant.legalName,
      logoUrl: tenant.settings?.logoUrl ?? null,
      ...profile,
      fullAddress: [profile.address, [cityLine, profile.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', '),
    };
  }

  private async sectionStudents(tenantId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId, deletedAt: null },
      select: { id: true, name: true, class: { select: { id: true, name: true } } },
    });
    if (!section) throw new NotFoundException('Section not found');
    const year = await this.years.requireCurrent(tenantId);
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenantId, academicYearId: year.id, sectionId, student: { deletedAt: null, status: 'ACTIVE' } },
      select: { rollNumber: true, student: { select: studentSelect } },
    });
    enrollments.sort(
      (a, b) =>
        (a.rollNumber ?? Number.MAX_SAFE_INTEGER) - (b.rollNumber ?? Number.MAX_SAFE_INTEGER) ||
        personName(a.student).localeCompare(personName(b.student)),
    );
    return { section, year, enrollments };
  }

  // Serials are <TYPE>/<yyyy>/<0001>, sequential per type and year.
  private async nextSerials(tx: Tx, tenantId: string, type: CertificateType, year: number, count: number) {
    const prefix = `${type}/${year}/`;
    const rows = await tx.issuedCertificate.findMany({
      where: { tenantId, serialNumber: { startsWith: prefix } },
      select: { serialNumber: true },
    });
    const max = rows.reduce((m, r) => Math.max(m, Number.parseInt(r.serialNumber.slice(prefix.length), 10) || 0), 0);
    return Array.from({ length: count }, (_, i) => `${prefix}${String(max + 1 + i).padStart(4, '0')}`);
  }

  // A concurrent issue can take the same serial: retry a few times.
  private async withSerialRetry<T>(run: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await run();
      } catch (error) {
        const collision =
          attempt < 5 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          JSON.stringify(error.meta?.target ?? '').includes('serial_number');
        if (!collision) throw error;
      }
    }
  }

  private activeTc(tenantId: string, studentId: string) {
    return this.prisma.issuedCertificate.findFirst({
      where: { tenantId, studentId, type: 'TC', revokedAt: null },
      select: { id: true, serialNumber: true },
    });
  }

  private async findStudentOrThrow(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, tenantId, deletedAt: null }, select: studentSelect });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  private async timezone(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return settings?.timezone || 'Asia/Kolkata';
  }

  private async userNames(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((v): v is string => !!v))];
    const users = unique.length
      ? await this.prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    return new Map(users.map((u) => [u.id, personName(u)]));
  }

  private splitData(data: Prisma.JsonValue): JsonObject & { snapshot?: CertificateSnapshot } {
    const obj: JsonObject = isPlainObject(data) ? data : {};
    const { snapshot, ...rest } = obj;
    return { snapshot: isPlainObject(snapshot) ? (snapshot as unknown as CertificateSnapshot) : undefined, ...rest };
  }

  private mapRow(
    row: Prisma.IssuedCertificateGetPayload<{
      include: { student: { select: { id: true; firstName: true; lastName: true; admissionNumber: true; status: true } } };
    }>,
    issuers: Map<string, string>,
  ) {
    const { snapshot, revocation, ...fields } = this.splitData(row.data);
    const rev = isPlainObject(revocation) ? revocation : null;
    return {
      id: row.id,
      type: row.type,
      title: CERTIFICATE_TITLES[row.type as CertificateType] ?? row.type,
      serialNumber: row.serialNumber,
      issuedAt: row.issuedAt,
      revokedAt: row.revokedAt,
      revoked: !!row.revokedAt,
      revokeReason: rev && typeof rev.reason === 'string' ? rev.reason : null,
      student: {
        id: row.student.id,
        name: personName(row.student),
        admissionNumber: row.student.admissionNumber,
        status: row.student.status,
      },
      classSection: snapshot?.enrollment?.label ?? null,
      issuedBy: row.issuedById ? { id: row.issuedById, name: issuers.get(row.issuedById) ?? 'Unknown user' } : null,
      details: fields,
    };
  }
}
