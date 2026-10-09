import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ADMIN_ROLE_CODE, LeaveStatus, MembershipStatus, Prisma, StaffStatus } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { decimal } from '../../common/utils/money';
import { getPagination, paginated } from '../../common/utils/pagination';
import { parseDateOnly } from '../../common/utils/date';
import { BranchesService } from '../academic/branches.service';
import { CreateStaffDto, StaffListQueryDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffAttendanceService } from './staff-attendance.service';
import { EMPLOYED_STATUSES, generatePassword, hasPermission, inclusiveDays, staffName } from './staff-hr.utils';

type Tx = Prisma.TransactionClient;

const DEFAULT_ROLE = 'TEACHER';
// Roles that are not staff roles and cannot be assigned from Staff & HR.
const NON_STAFF_ROLES = ['STUDENT', 'PARENT'];
const AUTO_CODE_PREFIX = 'EMP-';
const BCRYPT_ROUNDS = 10;

const staffSelect = {
  id: true,
  userId: true,
  branchId: true,
  employeeCode: true,
  isTeachingStaff: true,
  specialization: true,
  designation: true,
  department: true,
  joiningDate: true,
  basicSalary: true,
  status: true,
  createdAt: true,
  user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.StaffSelect;

type StaffRow = Prisma.StaffGetPayload<{ select: typeof staffSelect }>;
type MembershipInfo = { id: string; status: MembershipStatus; roles: { code: string; name: string }[] };

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchesService,
    private readonly attendance: StaffAttendanceService,
  ) {}

  // ================================================================== reads
  async list(user: AuthUser, query: StaffListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.StaffWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.department && { department: { equals: query.department.trim(), mode: 'insensitive' } }),
      ...(query.designation && { designation: { contains: query.designation.trim(), mode: 'insensitive' } }),
      ...(query.isTeachingStaff !== undefined && { isTeachingStaff: query.isTeachingStaff }),
    };
    const terms = query.search?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (terms.length) {
      where.AND = terms.map((term) => ({
        OR: [
          { employeeCode: { contains: term, mode: 'insensitive' } },
          { user: { firstName: { contains: term, mode: 'insensitive' } } },
          { user: { lastName: { contains: term, mode: 'insensitive' } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { user: { phone: { contains: term } } },
        ],
      }));
    }

    const [rows, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
        select: staffSelect,
      }),
      this.prisma.staff.count({ where }),
    ]);
    const memberships = await this.membershipsByUser(
      user.tenantId,
      rows.map((r) => r.userId),
    );
    const showSalary = this.canSeeSalary(user);
    return paginated(
      rows.map((r) => this.toItem(r, memberships.get(r.userId), showSalary)),
      total,
      page,
      limit,
    );
  }

  // Shared contract: GET /staff/options → StaffOption[]
  async options(tenantId: string) {
    const rows = await this.prisma.staff.findMany({
      where: { tenantId, deletedAt: null, status: StaffStatus.ACTIVE },
      select: {
        id: true,
        employeeCode: true,
        designation: true,
        department: true,
        isTeachingStaff: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    return rows
      .map((s) => ({
        id: s.id,
        name: staffName(s.user),
        employeeCode: s.employeeCode,
        designation: s.designation,
        department: s.department,
        isTeachingStaff: s.isTeachingStaff,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async departments(tenantId: string) {
    const rows = await this.prisma.staff.findMany({
      where: { tenantId, deletedAt: null, department: { not: null } },
      distinct: ['department'],
      select: { department: true },
      orderBy: { department: 'asc' },
    });
    return rows.map((r) => r.department!.trim()).filter(Boolean);
  }

  // Roles that can be given to staff (used by the Add/Edit staff form).
  roles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId, code: { notIn: NON_STAFF_ROLES } },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, isSystem: true },
    });
  }

  async get(user: AuthUser, id: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, tenantId: user.tenantId, deletedAt: null }, select: staffSelect });
    if (!staff) throw new NotFoundException('Staff member not found');

    const today = await this.attendance.today(user.tenantId);
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() + 1;
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    const [memberships, approved, pendingCount, summaries] = await Promise.all([
      this.membershipsByUser(user.tenantId, [staff.userId]),
      this.prisma.staffLeave.findMany({
        where: { tenantId: user.tenantId, staffId: id, status: LeaveStatus.APPROVED, startDate: { lte: yearEnd }, endDate: { gte: yearStart } },
        select: { leaveType: true, startDate: true, endDate: true },
      }),
      this.prisma.staffLeave.count({ where: { tenantId: user.tenantId, staffId: id, status: LeaveStatus.PENDING } }),
      this.attendance.monthlySummary(user.tenantId, month, year, [id]),
    ]);

    const approvedDaysByType: Record<string, number> = {};
    for (const leave of approved) {
      const start = leave.startDate < yearStart ? yearStart : leave.startDate;
      const end = leave.endDate > yearEnd ? yearEnd : leave.endDate;
      approvedDaysByType[leave.leaveType] = (approvedDaysByType[leave.leaveType] ?? 0) + inclusiveDays(start, end);
    }
    const { lopDays, ...attendanceSummary } = summaries.get(id)!;

    return {
      ...this.toItem(staff, memberships.get(staff.userId), this.canSeeSalary(user)),
      userId: staff.userId,
      createdAt: staff.createdAt,
      isSelf: staff.userId === user.id,
      leaveSummary: {
        year,
        approvedDaysByType,
        totalApprovedDays: Object.values(approvedDaysByType).reduce((a, b) => a + b, 0),
        pendingCount,
      },
      attendanceSummary: { month, year, ...attendanceSummary, lossOfPayDays: lopDays },
    };
  }

  // ================================================================= writes
  async create(user: AuthUser, dto: CreateStaffDto) {
    const email = dto.email.trim().toLowerCase();
    const roleCode = (dto.roleCode ?? DEFAULT_ROLE).trim().toUpperCase();
    const role = await this.requireAssignableRole(user, roleCode);
    const branchId = await this.branches.resolveBranchId(user.tenantId, dto.branchId);
    await this.assertWithinPlanLimit(user.tenantId);

    const explicitCode = dto.employeeCode?.trim().toUpperCase();
    if (explicitCode) await this.assertCodeAvailable(user.tenantId, explicitCode);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        deletedAt: true,
        isActive: true,
        memberships: { where: { tenantId: user.tenantId }, select: { id: true } },
        staffProfiles: { where: { tenantId: user.tenantId }, select: { id: true, deletedAt: true } },
      },
    });
    if (existingUser?.deletedAt) {
      throw new ConflictException('This email belongs to a deactivated account. Use a different email address.');
    }
    // A previously removed staff member can be re-hired: their old profile is restored.
    const restoreStaff = existingUser?.staffProfiles.find((s) => s.deletedAt) ?? null;
    if ((existingUser?.memberships.length || existingUser?.staffProfiles.some((s) => !s.deletedAt)) && !restoreStaff) {
      throw new ConflictException(`${email} is already a member of this school`);
    }

    // Password only for brand-new accounts; existing users keep their own.
    const temporaryPassword = existingUser ? null : dto.password ?? generatePassword();
    const passwordHash = temporaryPassword ? await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS) : null;

    const profile = {
      branchId,
      isTeachingStaff: dto.isTeachingStaff ?? true,
      specialization: dto.specialization?.trim() || null,
      designation: dto.designation?.trim() || null,
      department: dto.department?.trim() || null,
      joiningDate: dto.joiningDate ? parseDateOnly(dto.joiningDate) : null,
      basicSalary: decimal(dto.basicSalary ?? 0),
      status: StaffStatus.ACTIVE,
    };

    const run = () =>
      this.prisma.$transaction(async (tx) => {
        const employeeCode = explicitCode ?? (await this.nextEmployeeCode(tx, user.tenantId));

        let userId = existingUser?.id;
        if (userId) {
          await tx.user.update({
            where: { id: userId },
            data: { isActive: true, ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }) },
          });
        } else {
          const created = await tx.user.create({
            data: {
              email,
              passwordHash: passwordHash!,
              mustChangePassword: true,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone?.trim() || null,
            },
          });
          userId = created.id;
        }

        const membership = await tx.membership.upsert({
          where: { tenantId_userId: { tenantId: user.tenantId, userId } },
          create: { tenantId: user.tenantId, userId, status: MembershipStatus.ACTIVE },
          update: { status: MembershipStatus.ACTIVE },
        });
        await tx.membershipRole.deleteMany({ where: { membershipId: membership.id } });
        await tx.membershipRole.create({ data: { membershipId: membership.id, roleId: role.id } });

        const staff = restoreStaff
          ? await tx.staff.update({ where: { id: restoreStaff.id }, data: { ...profile, employeeCode, deletedAt: null } })
          : await tx.staff.create({ data: { ...profile, tenantId: user.tenantId, userId, employeeCode } });

        await this.audit.log(
          user,
          restoreStaff ? 'RESTORE' : 'CREATE',
          'Staff',
          staff.id,
          { email, employeeCode, roleCode, newAccount: !existingUser },
          tx,
        );
        return staff;
      });

    // Auto-generated codes can collide with a concurrent create: retry a few times.
    let staff: Awaited<ReturnType<typeof run>> | undefined;
    for (let attempt = 1; !staff; attempt++) {
      try {
        staff = await run();
      } catch (error) {
        const collision =
          !explicitCode &&
          attempt < 5 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          JSON.stringify(error.meta?.target ?? '').includes('employee_code');
        if (!collision) throw error;
      }
    }

    const detail = await this.get(user, staff.id);
    return {
      ...detail,
      existingAccount: !!existingUser,
      ...(temporaryPassword && { temporaryPassword }),
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateStaffDto) {
    const staff = await this.findOrThrow(user.tenantId, id);
    const branchId = dto.branchId ? await this.branches.resolveBranchId(user.tenantId, dto.branchId) : undefined;

    const employeeCode = dto.employeeCode?.trim().toUpperCase();
    if (employeeCode && employeeCode !== staff.employeeCode) await this.assertCodeAvailable(user.tenantId, employeeCode, id);

    let newRoleId: string | undefined;
    const membership = (await this.membershipsByUser(user.tenantId, [staff.userId])).get(staff.userId);
    if (dto.roleCode) {
      const roleCode = dto.roleCode.trim().toUpperCase();
      const role = await this.requireAssignableRole(user, roleCode);
      const currentCodes = membership?.roles.map((r) => r.code) ?? [];
      const unchanged = currentCodes.length === 1 && currentCodes[0] === roleCode;
      if (!unchanged) {
        if (currentCodes.includes(ADMIN_ROLE_CODE) && roleCode !== ADMIN_ROLE_CODE) {
          await this.assertCanLoseAdmin(user, staff.userId, 'remove the administrator role from');
        }
        newRoleId = role.id;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.staff.update({
        where: { id },
        data: {
          branchId,
          employeeCode: employeeCode || undefined,
          isTeachingStaff: dto.isTeachingStaff,
          specialization: dto.specialization !== undefined ? dto.specialization.trim() || null : undefined,
          designation: dto.designation !== undefined ? dto.designation.trim() || null : undefined,
          department: dto.department !== undefined ? dto.department.trim() || null : undefined,
          joiningDate: dto.joiningDate !== undefined ? (dto.joiningDate ? parseDateOnly(dto.joiningDate) : null) : undefined,
          basicSalary: dto.basicSalary !== undefined ? decimal(dto.basicSalary) : undefined,
        },
      });
      if (dto.firstName !== undefined || dto.lastName !== undefined || dto.phone !== undefined) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            firstName: dto.firstName?.trim() || undefined,
            lastName: dto.lastName?.trim() || undefined,
            phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
          },
        });
      }
      if (newRoleId) {
        const membershipId =
          membership?.id ??
          (
            await tx.membership.create({
              data: { tenantId: user.tenantId, userId: staff.userId, status: MembershipStatus.ACTIVE },
            })
          ).id;
        await tx.membershipRole.deleteMany({ where: { membershipId } });
        await tx.membershipRole.create({ data: { membershipId, roleId: newRoleId } });
      }
      await this.audit.log(user, 'UPDATE', 'Staff', id, { ...dto }, tx);
    });

    return this.get(user, id);
  }

  async setStatus(user: AuthUser, id: string, status: StaffStatus) {
    const staff = await this.findOrThrow(user.tenantId, id);
    if (staff.status === status) return this.get(user, id);

    const leaving = status === StaffStatus.RESIGNED || status === StaffStatus.TERMINATED;
    if (leaving) await this.assertCanLoseAdmin(user, staff.userId, `mark as ${status.toLowerCase()}`, true);
    if (!leaving && !EMPLOYED_STATUSES.includes(staff.status)) {
      // Re-activating a former employee counts towards the plan again.
      await this.assertWithinPlanLimit(user.tenantId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data: { status } });
      const membershipStatus = leaving ? MembershipStatus.SUSPENDED : status === StaffStatus.ACTIVE ? MembershipStatus.ACTIVE : null;
      if (membershipStatus) {
        await tx.membership.updateMany({
          where: { tenantId: user.tenantId, userId: staff.userId },
          data: { status: membershipStatus },
        });
      }
      await this.audit.log(user, 'STATUS_CHANGE', 'Staff', id, { from: staff.status, to: status }, tx);
    });
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string) {
    const staff = await this.findOrThrow(user.tenantId, id);
    await this.assertCanLoseAdmin(user, staff.userId, 'delete', true);

    // Free the employee code so it can be reused.
    const suffix = `~DEL-${Date.now().toString(36).toUpperCase()}`;
    const archivedCode = `${staff.employeeCode.slice(0, 64 - suffix.length)}${suffix}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data: { deletedAt: new Date(), employeeCode: archivedCode } });
      await tx.membership.updateMany({
        where: { tenantId: user.tenantId, userId: staff.userId },
        data: { status: MembershipStatus.SUSPENDED },
      });
      await this.audit.log(user, 'DELETE', 'Staff', id, { employeeCode: staff.employeeCode }, tx);
    });
    return { id, deleted: true };
  }

  async resetPassword(user: AuthUser, id: string) {
    const staff = await this.findOrThrow(user.tenantId, id);
    const memberships = await this.prisma.membership.findMany({
      where: { userId: staff.userId },
      select: { tenantId: true, roles: { select: { role: { select: { code: true } } } } },
    });
    if (memberships.some((m) => m.tenantId !== user.tenantId)) {
      throw new BadRequestException(
        'This login is shared with another school, so its password cannot be reset here. Ask the staff member to use "Forgot password".',
      );
    }
    const targetIsAdmin = memberships.some((m) => m.roles.some((r) => r.role.code === ADMIN_ROLE_CODE));
    if (targetIsAdmin && !user.isAdmin && staff.userId !== user.id) {
      throw new ForbiddenException("Only an administrator can reset another administrator's password");
    }

    const temporaryPassword = generatePassword();
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS), mustChangePassword: true },
    });
    await this.audit.log(user, 'RESET_PASSWORD', 'Staff', id, {});
    return { temporaryPassword };
  }

  // ================================================================ helpers
  private canSeeSalary(user: AuthUser) {
    return hasPermission(user, PERMISSIONS.PAYROLL_MANAGE) || hasPermission(user, PERMISSIONS.STAFF_UPDATE);
  }

  private toItem(s: StaffRow, membership: MembershipInfo | undefined, showSalary: boolean) {
    return {
      id: s.id,
      employeeCode: s.employeeCode,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      name: staffName(s.user),
      email: s.user.email,
      phone: s.user.phone,
      avatarUrl: s.user.avatarUrl,
      designation: s.designation,
      department: s.department,
      specialization: s.specialization,
      joiningDate: s.joiningDate,
      basicSalary: showSalary ? s.basicSalary : null,
      status: s.status,
      isTeachingStaff: s.isTeachingStaff,
      branch: s.branch,
      roles: membership?.roles ?? [],
      membershipStatus: membership?.status ?? null,
    };
  }

  private async membershipsByUser(tenantId: string, userIds: string[]) {
    const map = new Map<string, MembershipInfo>();
    if (!userIds.length) return map;
    const rows = await this.prisma.membership.findMany({
      where: { tenantId, userId: { in: userIds } },
      select: { id: true, userId: true, status: true, roles: { select: { role: { select: { code: true, name: true } } } } },
    });
    rows.forEach((m) => map.set(m.userId, { id: m.id, status: m.status, roles: m.roles.map((r) => r.role) }));
    return map;
  }

  private async findOrThrow(tenantId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  private async requireAssignableRole(user: AuthUser, roleCode: string) {
    if (NON_STAFF_ROLES.includes(roleCode)) throw new BadRequestException(`The ${roleCode.toLowerCase()} role cannot be given to staff`);
    const role = await this.prisma.role.findUnique({ where: { tenantId_code: { tenantId: user.tenantId, code: roleCode } } });
    if (!role) throw new BadRequestException(`Role '${roleCode}' does not exist in this school`);
    if (role.code === ADMIN_ROLE_CODE && !user.isAdmin) {
      throw new ForbiddenException('Only an administrator can grant the administrator role');
    }
    return role;
  }

  // Protects against locking the school out: you cannot remove/suspend yourself,
  // and the last active administrator must keep the role.
  private async assertCanLoseAdmin(user: AuthUser, targetUserId: string, action: string, blockSelf = false) {
    if (targetUserId === user.id && (blockSelf || user.isAdmin)) {
      throw new BadRequestException(`You cannot ${action} yourself`);
    }
    const targetIsAdmin = await this.prisma.membershipRole.count({
      where: {
        membership: { tenantId: user.tenantId, userId: targetUserId },
        role: { tenantId: user.tenantId, code: ADMIN_ROLE_CODE },
      },
    });
    if (!targetIsAdmin) return;
    if (!user.isAdmin) throw new ForbiddenException('Only an administrator can change another administrator');
    const activeAdmins = await this.prisma.membership.count({
      where: {
        tenantId: user.tenantId,
        status: MembershipStatus.ACTIVE,
        roles: { some: { role: { code: ADMIN_ROLE_CODE } } },
      },
    });
    if (activeAdmins <= 1) throw new BadRequestException('The school must keep at least one active administrator');
  }

  private async assertWithinPlanLimit(tenantId: string) {
    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { plan: { select: { name: true, maxStaff: true } } },
    });
    if (!subscription) return;
    const count = await this.prisma.staff.count({ where: { tenantId, deletedAt: null, status: { in: EMPLOYED_STATUSES } } });
    if (count >= subscription.plan.maxStaff) {
      throw new ForbiddenException(
        `Your ${subscription.plan.name} plan allows up to ${subscription.plan.maxStaff} staff members. Upgrade the plan to add more.`,
      );
    }
  }

  private async assertCodeAvailable(tenantId: string, employeeCode: string, exceptId?: string) {
    const clash = await this.prisma.staff.findFirst({
      where: { tenantId, employeeCode, ...(exceptId && { id: { not: exceptId } }) },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`Employee code ${employeeCode} is already in use`);
  }

  private async nextEmployeeCode(tx: Tx, tenantId: string) {
    const rows = await tx.staff.findMany({
      where: { tenantId, employeeCode: { startsWith: AUTO_CODE_PREFIX } },
      select: { employeeCode: true },
    });
    const max = rows.reduce((acc, r) => {
      const match = /^EMP-(\d+)$/.exec(r.employeeCode);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    return `${AUTO_CODE_PREFIX}${String(max + 1).padStart(4, '0')}`;
  }
}

