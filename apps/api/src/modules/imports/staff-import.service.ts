import { Injectable } from '@nestjs/common';
import { ADMIN_ROLE_CODE, StaffStatus } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { IssuedCredential } from '../../common/services/credentials.service';
import type { AuthUser } from '../../common/types/auth-user';
import { formatDateOnly, todayDateOnly } from '../../common/utils/date';
import { StaffService } from '../staff/staff.service';
import type { CreateStaffDto } from '../staff/dto/staff.dto';
import { CommitStaffImportDto, StaffImportRowDto, ValidateStaffImportDto } from './dto/imports.dto';
import {
  clean,
  isError,
  listForMessage,
  looseKey,
  parseAmount,
  parseDate,
  parseEmail,
  parseMobile,
  parseYesNo,
  type Parsed,
} from './import-utils';
import { RowCheck, rowErrorMessage, summarize, type RowResult } from './import-results';

const NON_STAFF_ROLES = ['STUDENT', 'PARENT'];
const EMPLOYED: StaffStatus[] = [StaffStatus.ACTIVE, StaffStatus.ON_LEAVE];
const EMPLOYEE_CODE_RE = /^[A-Za-z0-9/_-]+$/;

// Friendly role names → system role codes.
const ROLE_ALIASES: Record<string, string> = {
  teacher: 'TEACHER',
  teachers: 'TEACHER',
  teachingstaff: 'TEACHER',
  accountant: 'ACCOUNTANT',
  accounts: 'ACCOUNTANT',
  staff: 'STAFF',
  nonteaching: 'STAFF',
  nonteachingstaff: 'STAFF',
  admin: ADMIN_ROLE_CODE,
  administrator: ADMIN_ROLE_CODE,
  schooladmin: ADMIN_ROLE_CODE,
  schooladministrator: ADMIN_ROLE_CODE,
};

export interface NormalizedStaff {
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  roleCode: string;
  roleName: string;
  isTeachingStaff: boolean;
  joiningDate: string | null;
  basicSalary: number | null;
  branchId: string | null;
  branchName: string | null;
  existingAccount: boolean;
}

interface Context {
  today: string;
  roles: { code: string; name: string }[];
  branches: { id: string; code: string; name: string }[];
  plan: { name: string; maxStaff: number } | null;
  employed: number;
  takenCodes: Set<string>;
  usersByEmail: Map<
    string,
    { deletedAt: Date | null; memberOfSchool: boolean; activeStaff: boolean; removedStaff: boolean }
  >;
}

export interface StaffImportCommitResult {
  created: { rowNumber: number; staffId: string; employeeCode: string; name: string; email: string }[];
  failed: { rowNumber: number; errors: string[] }[];
  credentials: IssuedCredential[];
  skippedLogins: { name: string; role: string; reason: string }[];
}

// Bulk staff onboarding from a spreadsheet. validate() never writes; commit()
// re-validates and creates each row through StaffService.create.
@Injectable()
export class StaffImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staff: StaffService,
  ) {}

  async validate(user: AuthUser, dto: ValidateStaffImportDto) {
    const ctx = await this.loadContext(user.tenantId, dto.rows);
    const rows = this.check(user, ctx, dto.rows, dto.options?.precedingRows ?? 0);
    return { rows, summary: summarize(rows) };
  }

  async commit(user: AuthUser, dto: CommitStaffImportDto): Promise<StaffImportCommitResult> {
    const ctx = await this.loadContext(user.tenantId, dto.rows);
    const checked = this.check(user, ctx, dto.rows, 0);
    const result: StaffImportCommitResult = { created: [], failed: [], credentials: [], skippedLogins: [] };

    for (const row of checked) {
      const s = row.normalized;
      if (row.status === 'error' || !s) {
        result.failed.push({ rowNumber: row.rowNumber, errors: row.errors });
        continue;
      }
      try {
        const created = await this.staff.create(user, this.toCreateDto(s));
        result.created.push({
          rowNumber: row.rowNumber,
          staffId: created.id,
          employeeCode: created.employeeCode,
          name: created.name,
          email: created.email,
        });
        const credential: IssuedCredential = {
          userId: created.userId,
          role: 'STAFF',
          name: created.name,
          loginId: created.email,
          email: created.email,
          temporaryPassword: created.temporaryPassword ?? null,
          existingAccount: created.existingAccount,
        };
        if (credential.temporaryPassword || credential.existingAccount) result.credentials.push(credential);
        else result.skippedLogins.push({ name: created.name, role: 'STAFF', reason: 'Already has a login' });
      } catch (error) {
        result.failed.push({ rowNumber: row.rowNumber, errors: [rowErrorMessage(error)] });
      }
    }

    await this.audit.log(user, 'IMPORT', 'Staff', null, {
      rows: dto.rows.length,
      created: result.created.length,
      failed: result.failed.length,
      loginsIssued: result.credentials.filter((c) => c.temporaryPassword).length,
      firstRow: dto.rows[0]?.rowNumber,
      lastRow: dto.rows[dto.rows.length - 1]?.rowNumber,
    });
    return result;
  }

  // ================================================================ checking
  private async loadContext(tenantId: string, rows: StaffImportRowDto[]): Promise<Context> {
    const codes = new Set<string>();
    const emails = new Set<string>();
    for (const row of rows) {
      const code = clean(row.employeeCode).toUpperCase();
      if (code) codes.add(code);
      const email = parseEmail(row.email ?? '', 'Email');
      if (!isError(email) && email.value) emails.add(email.value);
    }

    const [settings, roles, branches, subscription, employed, takenCodes, users] = await Promise.all([
      this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } }),
      this.prisma.role.findMany({
        where: { tenantId, code: { notIn: NON_STAFF_ROLES } },
        select: { code: true, name: true },
      }),
      this.prisma.branch.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { plan: { select: { name: true, maxStaff: true } } },
      }),
      this.prisma.staff.count({ where: { tenantId, deletedAt: null, status: { in: EMPLOYED } } }),
      codes.size
        ? this.prisma.staff.findMany({ where: { tenantId, employeeCode: { in: [...codes] } }, select: { employeeCode: true } })
        : Promise.resolve([]),
      emails.size
        ? this.prisma.user.findMany({
            where: { email: { in: [...emails] } },
            select: {
              email: true,
              deletedAt: true,
              memberships: { select: { tenantId: true } },
              staffProfiles: { where: { tenantId }, select: { deletedAt: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      today: formatDateOnly(todayDateOnly(settings?.timezone || 'Asia/Kolkata')),
      roles,
      branches,
      plan: subscription?.plan ?? null,
      employed,
      takenCodes: new Set(takenCodes.map((s) => s.employeeCode.toUpperCase())),
      usersByEmail: new Map(
        users.map((u) => [
          u.email,
          {
            deletedAt: u.deletedAt,
            memberOfSchool: u.memberships.some((m) => m.tenantId === tenantId),
            activeStaff: u.staffProfiles.some((s) => !s.deletedAt),
            removedStaff: u.staffProfiles.some((s) => !!s.deletedAt),
                      },
        ]),
      ),
    };
  }

  private check(user: AuthUser, ctx: Context, rows: StaffImportRowDto[], precedingRows: number): RowResult<NormalizedStaff>[] {
    const checks = rows.map((r) => new RowCheck(r.rowNumber));
    const normalized = rows.map((row, i) => this.checkRow(user, ctx, row, checks[i]));

    // Duplicates inside the file.
    const firstEmail = new Map<string, number>();
    const firstCode = new Map<string, number>();
    normalized.forEach((s, i) => {
      if (!s) return;
      const prev = firstEmail.get(s.email);
      if (prev !== undefined) checks[i].error(`Email ${s.email} is repeated in the file (row ${prev})`);
      else firstEmail.set(s.email, checks[i].rowNumber);
      if (s.employeeCode) {
        const prevCode = firstCode.get(s.employeeCode);
        if (prevCode !== undefined) checks[i].error(`Employee Code ${s.employeeCode} is repeated in the file (row ${prevCode})`);
        else firstCode.set(s.employeeCode, checks[i].rowNumber);
      }
    });

    // Plan limit on the rows that would otherwise be imported.
    if (ctx.plan) {
      let remaining = ctx.plan.maxStaff - ctx.employed - precedingRows;
      normalized.forEach((s, i) => {
        if (!s || !checks[i].ok) return;
        if (remaining > 0) remaining--;
        else {
          checks[i].error(
            `Plan limit reached: your ${ctx.plan!.name} plan allows ${ctx.plan!.maxStaff} staff members (you have ${ctx.employed}). Upgrade the plan to import more`,
          );
        }
      });
    }

    return checks.map((c, i) => c.result(normalized[i]));
  }

  private checkRow(user: AuthUser, ctx: Context, row: StaffImportRowDto, c: RowCheck): NormalizedStaff | null {
    const take = <T>(parsed: Parsed<T>, fallback: T): T => {
      if (isError(parsed)) {
        c.error(parsed.error);
        return fallback;
      }
      return parsed.value;
    };

    const firstName = clean(row.firstName);
    const lastName = clean(row.lastName);
    if (!firstName) c.error('First Name is required');
    if (firstName.length > 128) c.error('First Name is longer than 128 characters');
    if (lastName.length > 128) c.error('Last Name is longer than 128 characters');

    // ---- email / existing account
    const email = take(parseEmail(row.email ?? '', 'Email'), null);
    if (!clean(row.email)) c.error('Email is required (staff sign in with it)');
    let existingAccount = false;
    if (email) {
      const account = ctx.usersByEmail.get(email);
      if (account?.deletedAt) {
        c.error(`${email} belongs to a deactivated account. Use a different email address`);
      } else if (account) {
        const restore = account.removedStaff && !account.activeStaff;
        if ((account.memberOfSchool || account.activeStaff) && !restore) {
          c.error(`${email} is already a member of this school`);
        } else if (restore) {
          existingAccount = true;
          c.warn('Previously removed staff member: their old profile will be restored and they keep their existing password');
        } else {
          existingAccount = true;
          c.warn('Linked to an existing account (used at another school): they keep their existing password');
        }
      }
    }

    const phone = take(parseMobile(row.mobile ?? '', 'Mobile'), null);

    // ---- employee code
    const employeeCode = clean(row.employeeCode).toUpperCase() || null;
    if (employeeCode) {
      if (employeeCode.length > 40) c.error('Employee Code is longer than 40 characters');
      else if (!EMPLOYEE_CODE_RE.test(employeeCode)) c.error('Employee Code may contain only letters, numbers, /, - and _');
      else if (ctx.takenCodes.has(employeeCode)) c.error(`Employee Code ${employeeCode} is already in use`);
    }

    const designation = clean(row.designation) || null;
    const department = clean(row.department) || null;
    if (designation && designation.length > 128) c.error('Designation is longer than 128 characters');
    if (department && department.length > 128) c.error('Department is longer than 128 characters');

    // ---- role
    const roleInput = clean(row.role);
    let role: { code: string; name: string } | undefined;
    if (!roleInput) c.error('Role is required (Teacher, Accountant, Staff or Admin)');
    else {
      const key = looseKey(roleInput);
      const alias = ROLE_ALIASES[key];
      role =
        ctx.roles.find((r) => looseKey(r.code) === key || looseKey(r.name) === key) ??
        (alias ? ctx.roles.find((r) => r.code === alias) : undefined);
      if (!role) {
        c.error(`Role '${roleInput}' does not exist in this school. Use one of: ${listForMessage(ctx.roles.map((r) => r.name), 10)}`);
      } else if (role.code === ADMIN_ROLE_CODE && !user.isAdmin) {
        c.error('Only an administrator can import staff with the Admin role');
      }
    }

    const teaching = take(parseYesNo(row.teachingStaff ?? '', 'Teaching Staff'), null);
    const joiningDate = take(parseDate(row.joiningDate ?? '', 'Joining Date'), null);
    if (joiningDate && joiningDate > ctx.today) c.warn('Joining Date is in the future');
    const basicSalary = take(parseAmount(row.basicSalary ?? '', 'Basic Salary'), null);

    // ---- branch
    let branch: { id: string; name: string } | null = null;
    const branchInput = clean(row.branchCode);
    if (branchInput) {
      const key = looseKey(branchInput);
      branch = ctx.branches.find((b) => looseKey(b.code) === key) ?? ctx.branches.find((b) => looseKey(b.name) === key) ?? null;
      if (!branch) c.error(`Branch Code '${branchInput}' not found. Branch codes: ${listForMessage(ctx.branches.map((b) => b.code), 10)}`);
    }

    if (!c.ok || !email || !role) return null;
    return {
      employeeCode,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      designation,
      department,
      roleCode: role.code,
      roleName: role.name,
      isTeachingStaff: teaching ?? role.code === 'TEACHER',
      joiningDate,
      basicSalary,
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? null,
      existingAccount,
    };
  }

  private toCreateDto(s: NormalizedStaff): CreateStaffDto {
    return {
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone ?? undefined,
      employeeCode: s.employeeCode ?? undefined,
      designation: s.designation ?? undefined,
      department: s.department ?? undefined,
      joiningDate: s.joiningDate ?? undefined,
      basicSalary: s.basicSalary ?? undefined,
      isTeachingStaff: s.isTeachingStaff,
      branchId: s.branchId ?? undefined,
      roleCode: s.roleCode,
    };
  }
}
