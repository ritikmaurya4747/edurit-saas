import { ForbiddenException, Injectable } from '@nestjs/common';
import { StudentStatus } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CredentialsService, IssuedCredential } from '../../common/services/credentials.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { todayDateOnly, formatDateOnly } from '../../common/utils/date';
import { AcademicYearsService } from '../academic/academic-years.service';
import { BranchesService } from '../academic/branches.service';
import { ClassesService } from '../academic/classes.service';
import { StudentsService } from '../students/students.service';
import type { CreateStudentDto, GuardianInputDto } from '../students/dto/students.dto';
import { CommitStudentImportDto, StudentImportOptionsDto, StudentImportRowDto, ValidateStudentImportDto } from './dto/imports.dto';
import {
  classNumber,
  clean,
  isError,
  listForMessage,
  looseKey,
  normalizeBloodGroup,
  parseDate,
  parseEmail,
  parseGender,
  parseMobile,
  parsePositiveInt,
  personName,
  phoneKey,
  sectionName,
  splitName,
  type Parsed,
} from './import-utils';
import { hasPermission, RowCheck, rowErrorMessage, summarize, type RowResult, type SkippedLogin } from './import-results';

const DEFAULT_SECTION_CAPACITY = 40;
const MAX_SECTION_CAPACITY = 500;

type Relationship = 'FATHER' | 'MOTHER';

export interface ImportGuardian {
  relationship: Relationship;
  firstName: string;
  lastName: string;
  phone: string;
  // Login email used to find-or-create the parent account (null = the
  // students service derives a placeholder from the mobile number).
  email: string | null;
  // Set when the mobile already belongs to a parent of this school.
  existingParentId: string | null;
}

export interface NormalizedStudent {
  admissionNumber: string | null;
  firstName: string;
  lastName: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  classId: string | null;
  className: string;
  sectionId: string | null;
  sectionName: string;
  // Stable key of the target section within one import: "<classId>|A" for an
  // existing class, "new:<class>|A" for a class the import will create.
  sectionKey: string;
  classLabel: string;
  createsClass: boolean;
  createsSection: boolean;
  rollNumber: number | null;
  bloodGroup: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  admissionDate: string | null;
  // Primary guardian first.
  guardians: ImportGuardian[];
}

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  number: number | null;
  sections: { id: string; name: string; capacity: number }[];
}

interface ExistingParent {
  parentId: string;
  email: string;
  name: string;
}

interface ExistingUser {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  deletedAt: Date | null;
}

// Everything the row checks need, loaded once per request (no writes).
interface Context {
  tenantId: string;
  today: string;
  yearId: string;
  classes: ClassInfo[];
  enrolledBySection: Map<string, number>;
  plan: { name: string; maxStudents: number } | null;
  activeStudents: number;
  takenAdmissionNumbers: Map<string, string>; // lower-case → as stored
  takenRolls: Map<string, Map<number, string>>; // sectionId → roll → student name
  parentsByPhone: Map<string, ExistingParent>;
  usersByEmail: Map<string, ExistingUser>;
  existingByDob: Map<string, { name: string; admissionNumber: string }[]>;
}

type ClassMatch = { kind: 'found'; cls: ClassInfo } | { kind: 'ambiguous'; matches: ClassInfo[] } | { kind: 'missing' };

export interface StudentImportCommitResult {
  created: { rowNumber: number; studentId: string; admissionNumber: string; name: string; classLabel: string }[];
  failed: { rowNumber: number; errors: string[] }[];
  warnings: { rowNumber: number; warnings: string[] }[];
  credentials: IssuedCredential[];
  skippedLogins: SkippedLogin[];
  classesCreated: string[];
}

// Bulk student admission from a spreadsheet (parsed in the browser).
// validate() never writes; commit() re-validates and then admits each row
// through StudentsService.create (same rules as the admission form).
@Injectable()
export class StudentImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly credentials: CredentialsService,
    private readonly years: AcademicYearsService,
    private readonly branches: BranchesService,
    private readonly classes: ClassesService,
    private readonly students: StudentsService,
  ) {}

  // ================================================================ validate
  async validate(user: AuthUser, dto: ValidateStudentImportDto) {
    const options = dto.options ?? {};
    this.assertCanCreateClasses(user, options);
    const ctx = await this.loadContext(user.tenantId, dto.rows);
    const rows = this.check(ctx, dto.rows, options, {
      precedingRows: options.precedingRows ?? 0,
      priorSectionCounts: sanitizeCounts(options.sectionCounts),
    });
    return { rows, summary: summarize(rows) };
  }

  // ================================================================== commit
  async commit(user: AuthUser, dto: CommitStudentImportDto): Promise<StudentImportCommitResult> {
    const options = dto.options ?? {};
    this.assertCanCreateClasses(user, options);
    const createStudentLogins = options.createStudentLogins ?? false;
    const createParentLogins = options.createParentLogins ?? true;
    const fileSectionCounts = sanitizeCounts(options.sectionCounts);

    // Never trust the client: everything is checked again against the
    // current data (earlier chunks of the same file are already saved).
    const ctx = await this.loadContext(user.tenantId, dto.rows);
    const checked = this.check(ctx, dto.rows, options, { precedingRows: 0, priorSectionCounts: new Map() });

    const result: StudentImportCommitResult = {
      created: [],
      failed: [],
      warnings: [],
      credentials: [],
      skippedLogins: [],
      classesCreated: [],
    };
    const valid: { rowNumber: number; data: NormalizedStudent; warnings: string[] }[] = [];
    for (const r of checked) {
      if (r.status === 'error' || !r.normalized) result.failed.push({ rowNumber: r.rowNumber, errors: r.errors });
      else valid.push({ rowNumber: r.rowNumber, data: r.normalized, warnings: [...r.warnings] });
    }

    // Classes / sections the file needs and the school does not have yet.
    const sectionIds = await this.createMissingSections(user, ctx, valid, fileSectionCounts, result);

    // Rows with an explicit roll number first so that auto-numbered rows
    // never take a roll number that a later row asks for.
    const ordered = [...valid].sort((a, b) => Number(b.data.rollNumber != null) - Number(a.data.rollNumber != null));
    const seenParents = new Set<string>();

    for (const row of ordered) {
      const s = row.data;
      const sectionId = s.sectionId ?? sectionIds.get(s.sectionKey);
      if (!sectionId) {
        // createMissingSections already reported why.
        if (!result.failed.some((f) => f.rowNumber === row.rowNumber)) {
          result.failed.push({ rowNumber: row.rowNumber, errors: [`Class ${s.classLabel} could not be created`] });
        }
        continue;
      }

      const [primary, second] = s.guardians;
      let detail: Awaited<ReturnType<StudentsService['create']>>;
      try {
        detail = await this.students.create(user, this.toCreateDto(s, sectionId, primary));
      } catch (error) {
        result.failed.push({ rowNumber: row.rowNumber, errors: [rowErrorMessage(error)] });
        continue;
      }
      result.created.push({
        rowNumber: row.rowNumber,
        studentId: detail.id,
        admissionNumber: detail.admissionNumber,
        name: detail.name,
        classLabel: s.classLabel,
      });

      if (second) {
        try {
          detail = await this.students.addGuardian(user, detail.id, {
            relationship: second.relationship,
            ...(second.existingParentId
              ? { parentId: second.existingParentId }
              : {
                  firstName: second.firstName,
                  lastName: second.lastName,
                  phone: second.phone,
                  email: second.email ?? undefined,
                }),
          });
        } catch (error) {
          row.warnings.push(
            `Student imported, but the ${second.relationship.toLowerCase()} could not be added as a guardian: ${rowErrorMessage(error)}. Add them from the student profile.`,
          );
        }
      }

      if (createStudentLogins) {
        await this.collectLogin(result, detail.name, 'STUDENT', () =>
          this.prisma.$transaction((tx) => this.credentials.issueStudentLogin(user.tenantId, detail.id, {}, tx)),
        );
      }
      if (createParentLogins) {
        for (const g of detail.guardians) {
          if (seenParents.has(g.parentId)) continue; // sibling in this chunk: one login per parent
          seenParents.add(g.parentId);
          await this.issueParentLogin(user, result, g.parentId, g.name, detail.name, s.classLabel);
        }
      }
      if (row.warnings.length) result.warnings.push({ rowNumber: row.rowNumber, warnings: row.warnings });
    }

    result.created.sort((a, b) => a.rowNumber - b.rowNumber);
    result.failed.sort((a, b) => a.rowNumber - b.rowNumber);
    result.warnings.sort((a, b) => a.rowNumber - b.rowNumber);
    // Only logins that have something to hand out go on the sheet.
    const issued = result.credentials;
    result.credentials = issued.filter((c) => c.temporaryPassword || c.existingAccount);
    issued
      .filter((c) => !c.temporaryPassword && !c.existingAccount)
      .forEach((c) => result.skippedLogins.push({ name: c.name, role: c.role, reason: 'Already has a login' }));

    await this.audit.log(user, 'IMPORT', 'Student', null, {
      rows: dto.rows.length,
      created: result.created.length,
      failed: result.failed.length,
      loginsIssued: result.credentials.length,
      loginsSkipped: result.skippedLogins.length,
      classesCreated: result.classesCreated,
      firstRow: dto.rows[0]?.rowNumber,
      lastRow: dto.rows[dto.rows.length - 1]?.rowNumber,
    });
    return result;
  }

  // ================================================================ checking
  private assertCanCreateClasses(user: AuthUser, options: StudentImportOptionsDto) {
    if (options.createMissingClasses && !hasPermission(user, PERMISSIONS.CLASS_MANAGE)) {
      throw new ForbiddenException(
        'You need the "Manage classes and sections" permission to create missing classes during an import. Untick the option or ask an administrator.',
      );
    }
  }

  private async loadContext(tenantId: string, rows: StudentImportRowDto[]): Promise<Context> {
    const year = await this.years.requireCurrent(tenantId);

    // Values used for targeted lookups.
    const admissionNumbers = new Set<string>();
    const emails = new Set<string>();
    const dobs = new Set<string>();
    for (const row of rows) {
      const adm = clean(row.admissionNo);
      if (adm) admissionNumbers.add(adm);
      for (const value of [row.fatherEmail, row.motherEmail]) {
        const email = parseEmail(value ?? '', 'Email');
        if (!isError(email) && email.value) emails.add(email.value);
      }
      const dob = parseDate(row.dob ?? '', 'Date of birth');
      if (!isError(dob) && dob.value) dobs.add(dob.value);
    }

    const [settings, classRows, enrolled, subscription, activeStudents, takenAdmissions, parents, users, sameDob] =
      await Promise.all([
        this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } }),
        this.prisma.class.findMany({
          where: { tenantId, deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
            branchId: true,
            branch: { select: { name: true } },
            sections: { where: { deletedAt: null }, select: { id: true, name: true, capacity: true } },
          },
        }),
        this.prisma.studentEnrollment.groupBy({
          by: ['sectionId'],
          where: { tenantId, academicYearId: year.id, student: { deletedAt: null, status: StudentStatus.ACTIVE } },
          _count: { _all: true },
        }),
        this.prisma.tenantSubscription.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          select: { plan: { select: { name: true, maxStudents: true } } },
        }),
        this.prisma.student.count({ where: { tenantId, deletedAt: null, status: StudentStatus.ACTIVE } }),
        admissionNumbers.size
          ? this.prisma.student.findMany({
              where: {
                tenantId,
                OR: [...admissionNumbers].map((v) => ({ admissionNumber: { equals: v, mode: 'insensitive' as const } })),
              },
              select: { admissionNumber: true },
            })
          : Promise.resolve([]),
        this.prisma.parent.findMany({
          where: { tenantId, deletedAt: null, user: { deletedAt: null, phone: { not: null } } },
          select: { id: true, user: { select: { email: true, phone: true, firstName: true, lastName: true } } },
        }),
        emails.size
          ? this.prisma.user.findMany({
              where: { email: { in: [...emails] } },
              select: { id: true, email: true, phone: true, firstName: true, lastName: true, deletedAt: true },
            })
          : Promise.resolve([]),
        dobs.size
          ? this.prisma.student.findMany({
              where: { tenantId, deletedAt: null, dob: { in: [...dobs].map((d) => new Date(`${d}T00:00:00.000Z`)) } },
              select: { firstName: true, lastName: true, dob: true, admissionNumber: true },
            })
          : Promise.resolve([]),
      ]);

    const sectionIds = classRows.flatMap((c) => c.sections.map((s) => s.id));
    const rollRows = sectionIds.length
      ? await this.prisma.studentEnrollment.findMany({
          where: { tenantId, academicYearId: year.id, sectionId: { in: sectionIds }, rollNumber: { not: null }, student: { deletedAt: null } },
          select: { sectionId: true, rollNumber: true, student: { select: { firstName: true, lastName: true } } },
        })
      : [];
    const takenRolls = new Map<string, Map<number, string>>();
    for (const r of rollRows) {
      if (r.rollNumber == null) continue;
      if (!takenRolls.has(r.sectionId)) takenRolls.set(r.sectionId, new Map());
      takenRolls.get(r.sectionId)!.set(r.rollNumber, personName(r.student));
    }

    const parentsByPhone = new Map<string, ExistingParent>();
    for (const p of parents) {
      const key = phoneKey(p.user.phone);
      if (key && key.length === 10 && !parentsByPhone.has(key)) {
        parentsByPhone.set(key, { parentId: p.id, email: p.user.email, name: personName(p.user) });
      }
    }

    const existingByDob = new Map<string, { name: string; admissionNumber: string }[]>();
    for (const s of sameDob) {
      const key = formatDateOnly(s.dob);
      if (!existingByDob.has(key)) existingByDob.set(key, []);
      existingByDob.get(key)!.push({ name: personName(s), admissionNumber: s.admissionNumber });
    }

    return {
      tenantId,
      today: formatDateOnly(todayDateOnly(settings?.timezone || 'Asia/Kolkata')),
      yearId: year.id,
      classes: classRows.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        branchId: c.branchId,
        branchName: c.branch.name,
        number: classNumber(c.name),
        sections: c.sections,
      })),
      enrolledBySection: new Map(enrolled.map((e) => [e.sectionId, e._count._all])),
      plan: subscription?.plan ?? null,
      activeStudents,
      takenAdmissionNumbers: new Map(takenAdmissions.map((s) => [s.admissionNumber.toLowerCase(), s.admissionNumber])),
      takenRolls,
      parentsByPhone,
      usersByEmail: new Map(
        users.map((u) => [u.email, { id: u.id, email: u.email, phone: u.phone, name: personName(u), deletedAt: u.deletedAt }]),
      ),
      existingByDob,
    };
  }

  private check(
    ctx: Context,
    rows: StudentImportRowDto[],
    options: StudentImportOptionsDto,
    file: { precedingRows: number; priorSectionCounts: Map<string, number> },
  ): RowResult<NormalizedStudent>[] {
    const createMissing = !!options.createMissingClasses;
    const checks = rows.map((row) => new RowCheck(row.rowNumber));
    const normalized: (NormalizedStudent | null)[] = [];

    // Same parent mobile in several rows (siblings) must end up on ONE login:
    // use the first email given for that mobile anywhere in the chunk.
    const emailForPhone = new Map<string, { email: string; rowNumber: number }>();
    for (const row of rows) {
      for (const [mobile, email] of [
        [row.fatherMobile, row.fatherEmail],
        [row.motherMobile, row.motherEmail],
      ]) {
        const phone = parseMobile(mobile ?? '', 'Mobile');
        const mail = parseEmail(email ?? '', 'Email');
        if (isError(phone) || !phone.value || isError(mail) || !mail.value) continue;
        if (!emailForPhone.has(phone.value)) emailForPhone.set(phone.value, { email: mail.value, rowNumber: row.rowNumber });
      }
    }

    rows.forEach((row, i) => normalized.push(this.checkRow(ctx, row, checks[i], createMissing, emailForPhone)));

    // ---- duplicates inside the file (chunk)
    const firstAdmission = new Map<string, number>();
    const firstRoll = new Map<string, number>();
    const firstPerson = new Map<string, number>();
    normalized.forEach((s, i) => {
      if (!s) return;
      const c = checks[i];
      if (s.admissionNumber) {
        const key = s.admissionNumber.toLowerCase();
        const first = firstAdmission.get(key);
        if (first !== undefined) c.error(`Admission No ${s.admissionNumber} is repeated in the file (row ${first})`);
        else firstAdmission.set(key, c.rowNumber);
      }
      if (s.rollNumber != null) {
        const key = `${s.sectionKey}#${s.rollNumber}`;
        const first = firstRoll.get(key);
        if (first !== undefined) c.error(`Roll No ${s.rollNumber} is repeated for ${s.classLabel} in the file (row ${first})`);
        else firstRoll.set(key, c.rowNumber);
      }
      const personKey = `${s.name.toLowerCase()}#${s.dob}`;
      const first = firstPerson.get(personKey);
      if (first !== undefined) c.warn(`Same name and date of birth as row ${first} — is this the same student twice?`);
      else firstPerson.set(personKey, c.rowNumber);
    });

    // ---- section capacity (existing sections; new ones are sized to fit)
    const inFile = new Map<string, number>();
    normalized.forEach((s, i) => {
      if (!s || !checks[i].ok || !s.sectionId) return;
      const section = ctx.classes.find((c) => c.id === s.classId)?.sections.find((x) => x.id === s.sectionId);
      if (!section) return;
      const before = (ctx.enrolledBySection.get(s.sectionId) ?? 0) + (file.priorSectionCounts.get(s.sectionKey) ?? 0);
      const n = (inFile.get(s.sectionKey) ?? 0) + 1;
      if (before + n > section.capacity) {
        checks[i].error(
          `${s.classLabel} is full: capacity ${section.capacity}, ${before + n - 1} student(s) already enrolled or earlier in this file. Increase the section capacity in Academic Setup or use another section`,
        );
      } else {
        inFile.set(s.sectionKey, n);
      }
    });

    // ---- plan limit (last, on the rows that would otherwise be imported)
    if (ctx.plan) {
      let remaining = ctx.plan.maxStudents - ctx.activeStudents - file.precedingRows;
      normalized.forEach((s, i) => {
        if (!s || !checks[i].ok) return;
        if (remaining > 0) remaining--;
        else {
          checks[i].error(
            `Plan limit reached: your ${ctx.plan!.name} plan allows ${ctx.plan!.maxStudents} active students (you have ${ctx.activeStudents}). Upgrade the plan to import more`,
          );
        }
      });
    }

    return checks.map((c, i) => c.result(normalized[i]));
  }

  private checkRow(
    ctx: Context,
    row: StudentImportRowDto,
    c: RowCheck,
    createMissing: boolean,
    emailForPhone: Map<string, { email: string; rowNumber: number }>,
  ): NormalizedStudent | null {
    const take = <T>(parsed: Parsed<T>, fallback: T): T => {
      if (isError(parsed)) {
        c.error(parsed.error);
        return fallback;
      }
      return parsed.value;
    };

    // ---- student
    const firstName = clean(row.firstName);
    const lastName = clean(row.lastName);
    if (!firstName) c.error('First Name is required');
    if (firstName.length > 128) c.error('First Name is longer than 128 characters');
    if (lastName.length > 128) c.error('Last Name is longer than 128 characters');

    const gender = take(parseGender(row.gender ?? ''), null);
    if (!clean(row.gender)) c.error('Gender is required (Male, Female or Other)');

    const dob = take(parseDate(row.dob ?? '', 'Date of Birth'), null);
    if (!clean(row.dob)) c.error('Date of Birth is required (DD-MM-YYYY)');
    const admissionDate = take(parseDate(row.admissionDate ?? '', 'Admission Date'), null);
    if (dob) {
      if (dob >= ctx.today) c.error(`Date of Birth ${displayDate(dob)} is today or in the future`);
      else {
        const age = Number(ctx.today.slice(0, 4)) - Number(dob.slice(0, 4));
        if (age < 2 || age > 25) c.warn(`Date of Birth ${displayDate(dob)} gives an age of about ${age} years — please double-check`);
        if (admissionDate && dob >= admissionDate) c.error('Date of Birth must be before the Admission Date');
      }
    }
    if (admissionDate && admissionDate > ctx.today) c.warn(`Admission Date ${displayDate(admissionDate)} is in the future`);

    const admissionNumber = clean(row.admissionNo) || null;
    if (admissionNumber) {
      if (admissionNumber.length > 48) c.error('Admission No is longer than 48 characters');
      if (admissionNumber.includes('~')) c.error('Admission No cannot contain "~"');
      const taken = ctx.takenAdmissionNumbers.get(admissionNumber.toLowerCase());
      if (taken) c.error(`Admission No ${taken} is already used by another student of this school`);
    }

    const rollNumber = take(parsePositiveInt(row.rollNo ?? '', 'Roll No'), null);
    const phone = take(parseMobile(row.studentMobile ?? '', 'Student Mobile'), null);
    const email = take(parseEmail(row.studentEmail ?? '', 'Student Email'), null);
    const address = clean(row.address) || null;
    if (address && address.length > 1000) c.error('Address is longer than 1000 characters');

    let bloodGroup: string | null = null;
    if (clean(row.bloodGroup)) {
      bloodGroup = normalizeBloodGroup(row.bloodGroup!);
      if (!bloodGroup) c.warn(`Blood Group '${clean(row.bloodGroup)}' is not recognised and will be left blank`);
    }

    // ---- class & section
    const target = this.resolveTarget(ctx, row, c, createMissing);
    if (target && rollNumber != null && target.sectionId) {
      const holder = ctx.takenRolls.get(target.sectionId)?.get(rollNumber);
      if (holder) c.error(`Roll No ${rollNumber} is already taken by ${holder} in ${target.classLabel}`);
    }

    // ---- duplicate of an existing student
    if (dob && firstName) {
      const name = `${firstName} ${lastName}`.trim().toLowerCase();
      const same = ctx.existingByDob.get(dob)?.find((s) => s.name.toLowerCase() === name);
      if (same) c.warn(`A student with the same name and date of birth already exists (${same.admissionNumber}) — possible duplicate`);
    }

    // ---- parents
    const guardians = this.checkParents(ctx, row, c, emailForPhone);

    if (!c.ok || !target || !gender || !dob) return null;
    return {
      admissionNumber,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      gender,
      dob,
      ...target,
      rollNumber,
      bloodGroup,
      phone,
      email,
      address,
      admissionDate,
      guardians,
    };
  }

  private resolveTarget(ctx: Context, row: StudentImportRowDto, c: RowCheck, createMissing: boolean) {
    const classInput = clean(row.className);
    const section = sectionName(row.section ?? '');
    if (!classInput) c.error('Class is required');
    if (!section) c.error('Section is required');
    if (section.length > 64) c.error('Section is longer than 64 characters');
    if (!classInput || !section || section.length > 64) return null;

    const match = this.matchClass(ctx, classInput);
    if (match.kind === 'ambiguous') {
      c.error(
        `Class '${classInput}' matches more than one class (${match.matches
          .map((m) => `${m.name} [${m.code}, ${m.branchName}]`)
          .join('; ')}). Use the class code instead`,
      );
      return null;
    }
    if (match.kind === 'missing') {
      const n = classNumber(classInput);
      const newName = n ? `Class ${n}` : classInput;
      if (newName.length > 64) {
        c.error('Class is longer than 64 characters');
        return null;
      }
      if (!createMissing) {
        c.error(
          `Class '${classInput}' was not found. Existing classes: ${listForMessage(ctx.classes.map((x) => x.name)) || 'none'}. Fix the name or tick "Create missing classes"`,
        );
        return null;
      }
      c.warn(`Class ${newName} with section ${section} will be created`);
      return {
        classId: null,
        className: newName,
        sectionId: null,
        sectionName: section,
        sectionKey: `new:${looseKey(newName)}|${section}`,
        classLabel: `${newName} - ${section}`,
        createsClass: true,
        createsSection: true,
      };
    }

    const cls = match.cls;
    const existing = cls.sections.find((s) => s.name.toUpperCase() === section);
    if (!existing && !createMissing) {
      c.error(
        `Section '${section}' was not found in ${cls.name} (sections: ${listForMessage(cls.sections.map((s) => s.name)) || 'none'}). Fix it or tick "Create missing classes/sections"`,
      );
      return null;
    }
    if (!existing) c.warn(`Section ${section} will be created in ${cls.name}`);
    return {
      classId: cls.id,
      className: cls.name,
      sectionId: existing?.id ?? null,
      sectionName: existing?.name ?? section,
      sectionKey: `${cls.id}|${section}`,
      classLabel: `${cls.name} - ${existing?.name ?? section}`,
      createsClass: false,
      createsSection: !existing,
    };
  }

  // Class by name or code (case / space-insensitive); "5", "Class 5", "V",
  // "5th" all find "Class 5" when exactly one class has that number.
  private matchClass(ctx: Context, input: string): ClassMatch {
    const key = looseKey(input);
    const byText = ctx.classes.filter((c) => looseKey(c.name) === key || looseKey(c.code) === key);
    if (byText.length === 1) return { kind: 'found', cls: byText[0] };
    if (byText.length > 1) {
      // A name match beats a code match ("5" named class vs code "5").
      const byName = byText.filter((c) => looseKey(c.name) === key);
      return byName.length === 1 ? { kind: 'found', cls: byName[0] } : { kind: 'ambiguous', matches: byText };
    }
    const n = classNumber(input);
    if (n == null) return { kind: 'missing' };
    const byNumber = ctx.classes.filter((c) => c.number === n);
    if (byNumber.length === 1) return { kind: 'found', cls: byNumber[0] };
    if (byNumber.length > 1) return { kind: 'ambiguous', matches: byNumber };
    return { kind: 'missing' };
  }

  private checkParents(
    ctx: Context,
    row: StudentImportRowDto,
    c: RowCheck,
    emailForPhone: Map<string, { email: string; rowNumber: number }>,
  ): ImportGuardian[] {
    const guardians: ImportGuardian[] = [];
    const inputs: { relationship: Relationship; label: string; name?: string; mobile?: string; email?: string }[] = [
      { relationship: 'FATHER', label: 'Father', name: row.fatherName, mobile: row.fatherMobile, email: row.fatherEmail },
      { relationship: 'MOTHER', label: 'Mother', name: row.motherName, mobile: row.motherMobile, email: row.motherEmail },
    ];

    for (const p of inputs) {
      const name = clean(p.name);
      const mobile = parseMobile(p.mobile ?? '', `${p.label} Mobile`);
      const email = parseEmail(p.email ?? '', `${p.label} Email`);
      if (isError(mobile)) c.error(mobile.error);
      if (isError(email)) c.error(email.error);
      if (isError(mobile) || isError(email)) continue;
      if (!name && !mobile.value && !email.value) continue;

      if (!name) {
        c.error(`${p.label} Name is required when ${p.label} Mobile or Email is given`);
        continue;
      }
      if (name.length > 255) {
        c.error(`${p.label} Name is too long`);
        continue;
      }
      if (!mobile.value) {
        c.warn(`${p.label} has no mobile number, so they are not added as a guardian (parents sign in with their mobile)`);
        continue;
      }

      const { firstName, lastName } = splitName(name);
      const guardian: ImportGuardian = {
        relationship: p.relationship,
        firstName: firstName.slice(0, 128),
        lastName: lastName.slice(0, 128),
        phone: mobile.value,
        email: email.value,
        existingParentId: null,
      };

      const existing = ctx.parentsByPhone.get(mobile.value);
      if (existing) {
        // Same mobile = same parent (sibling already in the school).
        guardian.existingParentId = existing.parentId;
        guardian.email = existing.email;
        c.warn(`${p.label} mobile ${mobile.value} belongs to existing parent ${existing.name} — the student will be linked to that account (sibling)`);
        if (email.value && email.value !== existing.email) {
          c.warn(`${p.label} Email ${email.value} is ignored because that parent account already has its own email`);
        }
      } else {
        const shared = emailForPhone.get(mobile.value);
        if (shared && shared.email !== email.value) {
          if (email.value) c.warn(`${p.label} mobile is used with a different email in row ${shared.rowNumber}; the email from row ${shared.rowNumber} is used`);
          guardian.email = shared.email;
        }
        if (guardian.email) {
          const account = ctx.usersByEmail.get(guardian.email);
          if (account?.deletedAt) {
            c.error(`${p.label} Email ${guardian.email} belongs to a deactivated account. Use a different email or leave it blank`);
            continue;
          }
          if (account && phoneKey(account.phone) && phoneKey(account.phone) !== mobile.value) {
            c.warn(
              `${p.label} Email ${guardian.email} already belongs to ${account.name} (mobile ${account.phone}); the student will be linked to that login`,
            );
          }
        }
      }
      guardians.push(guardian);
    }

    if (guardians.length === 2) {
      const [a, b] = guardians;
      const sameAccount =
        a.phone === b.phone ||
        (a.existingParentId && a.existingParentId === b.existingParentId) ||
        (a.email && a.email === b.email);
      if (sameAccount) {
        c.warn('Father and mother have the same mobile/email, so only the father is linked as guardian (each parent needs their own mobile to log in)');
        guardians.pop();
      }
    }
    if (!guardians.length && c.ok) {
      c.error('At least one parent (Father or Mother) with a name and a 10-digit mobile number is required');
    }
    return guardians;
  }

  // ================================================================ writing
  private toCreateDto(s: NormalizedStudent, sectionId: string, primary: ImportGuardian | undefined): CreateStudentDto {
    const guardian: GuardianInputDto | undefined = primary
      ? {
          firstName: primary.firstName,
          lastName: primary.lastName,
          relationship: primary.relationship,
          phone: primary.phone,
          email: primary.email ?? undefined,
        }
      : undefined;
    return {
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNumber: s.admissionNumber ?? undefined,
      dob: s.dob,
      gender: s.gender,
      bloodGroup: s.bloodGroup ?? undefined,
      phone: s.phone ?? undefined,
      email: s.email ?? undefined,
      address: s.address ?? undefined,
      admissionDate: s.admissionDate ?? undefined,
      sectionId,
      rollNumber: s.rollNumber ?? undefined,
      guardian,
    };
  }

  // Creates the classes / sections the valid rows need. Returns sectionKey →
  // sectionId. Rows whose class could not be created are moved to `failed`.
  private async createMissingSections(
    user: AuthUser,
    ctx: Context,
    valid: { rowNumber: number; data: NormalizedStudent }[],
    fileSectionCounts: Map<string, number>,
    result: StudentImportCommitResult,
  ) {
    const ids = new Map<string, string>();
    const needed = valid.filter((r) => r.data.createsSection);
    if (!needed.length) return ids;

    const inChunk = new Map<string, number>();
    needed.forEach((r) => inChunk.set(r.data.sectionKey, (inChunk.get(r.data.sectionKey) ?? 0) + 1));
    const capacityFor = (keys: string[]) => {
      const counts = keys.map((k) => fileSectionCounts.get(k) ?? 0);
      const wanted = Math.max(DEFAULT_SECTION_CAPACITY, ...counts, ...keys.map((k) => inChunk.get(k) ?? 0));
      return Math.min(MAX_SECTION_CAPACITY, wanted);
    };
    const fail = (keys: Set<string>, message: string) => {
      valid
        .filter((r) => keys.has(r.data.sectionKey))
        .forEach((r) => result.failed.push({ rowNumber: r.rowNumber, errors: [message] }));
    };

    // Group by class (existing id or new class name).
    const groups = new Map<string, { classId: string | null; className: string; sections: Map<string, string> }>();
    for (const r of needed) {
      const s = r.data;
      const groupKey = s.classId ?? `new:${looseKey(s.className)}`;
      if (!groups.has(groupKey)) groups.set(groupKey, { classId: s.classId, className: s.className, sections: new Map() });
      groups.get(groupKey)!.sections.set(s.sectionName, s.sectionKey);
    }

    let defaultBranchId: string | null = null;
    for (const group of groups.values()) {
      const keys = new Set(group.sections.values());
      let classId = group.classId;
      try {
        if (!classId) {
          defaultBranchId ??= await this.branches.resolveBranchId(user.tenantId);
          const created = await this.classes.create(user, {
            name: group.className,
            code: await this.uniqueClassCode(user.tenantId, defaultBranchId, group.className),
            branchId: defaultBranchId,
          });
          classId = created.id;
          result.classesCreated.push(group.className);
        }
      } catch (error) {
        fail(keys, `Class ${group.className} could not be created: ${rowErrorMessage(error)}`);
        continue;
      }
      const cls = ctx.classes.find((x) => x.id === classId);
      for (const [name, key] of group.sections) {
        try {
          const legacyKey = `new:${looseKey(group.className)}|${name}`;
          const section = await this.classes.addSection(user, classId, {
            name,
            capacity: capacityFor([key, legacyKey, ...(cls ? [`new:${looseKey(cls.name)}|${name}`] : [])]),
          });
          ids.set(key, section.id);
          if (group.classId) result.classesCreated.push(`${group.className} - ${name}`);
        } catch (error) {
          fail(new Set([key]), `Section ${group.className} - ${name} could not be created: ${rowErrorMessage(error)}`);
        }
      }
    }
    return ids;
  }

  private async uniqueClassCode(tenantId: string, branchId: string, name: string) {
    const n = classNumber(name);
    const base = (n ? `C${n}` : name.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12)) || 'CLASS';
    const existing = await this.prisma.class.findMany({
      where: { tenantId, branchId, code: { startsWith: base } },
      select: { code: true },
    });
    const taken = new Set(existing.map((c) => c.code.toUpperCase()));
    if (!taken.has(base)) return base;
    for (let i = 2; i < 1000; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
    return `${base}-${Date.now().toString(36).toUpperCase()}`.slice(0, 32);
  }

  // Issues a parent login unless the parent can already sign in (logged in
  // before, or a temporary password was issued earlier — e.g. for a sibling in
  // an earlier chunk of this import). Never overwrites a handed-out password.
  private async issueParentLogin(
    user: AuthUser,
    result: StudentImportCommitResult,
    parentId: string,
    parentName: string,
    studentName: string,
    classLabel: string,
  ) {
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, tenantId: user.tenantId },
      select: { user: { select: { lastLoginAt: true, mustChangePassword: true } } },
    });
    if (!parent) return;
    if (parent.user.lastLoginAt || parent.user.mustChangePassword) {
      result.skippedLogins.push({
        name: parentName,
        role: 'PARENT',
        reason: `Already has a login (parent of ${studentName}); keeps the existing password`,
      });
      return;
    }
    await this.collectLogin(result, parentName, 'PARENT', () =>
      this.prisma.$transaction((tx) =>
        this.credentials.issueParentLogin(user.tenantId, parentId, { studentName, classLabel }, tx),
      ),
    );
  }

  private async collectLogin(
    result: StudentImportCommitResult,
    name: string,
    role: string,
    run: () => Promise<IssuedCredential>,
  ) {
    try {
      result.credentials.push(await run());
    } catch (error) {
      result.skippedLogins.push({ name, role, reason: rowErrorMessage(error) });
    }
  }
}

// ================================================================ helpers
const displayDate = (ymd: string) => `${ymd.slice(8, 10)}-${ymd.slice(5, 7)}-${ymd.slice(0, 4)}`;


// Client-provided counts: keep only sane entries.
function sanitizeCounts(input: Record<string, number> | undefined) {
  const map = new Map<string, number>();
  if (!input || typeof input !== 'object') return map;
  for (const [key, value] of Object.entries(input).slice(0, 5000)) {
    const n = Number(value);
    if (typeof key === 'string' && key.length <= 200 && Number.isInteger(n) && n >= 0 && n <= 100_000) map.set(key, n);
  }
  return map;
}
