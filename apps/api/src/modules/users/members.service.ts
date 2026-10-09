import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_CODE, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CredentialsService } from '../../common/services/credentials.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { ListMembersQueryDto, SetMemberRolesDto, SetMemberStatusDto } from './dto/users.dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly credentials: CredentialsService,
  ) {}

  async list(tenantId: string, query: ListMembersQueryDto) {
    const { page, limit, skip, take } = getPagination(query);

    const tokens = (query.search ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
    const where: Prisma.MembershipWhereInput = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.roleCode && { roles: { some: { role: { code: query.roleCode.toUpperCase() } } } }),
      user: {
        deletedAt: null,
        ...(tokens.length && {
          AND: tokens.map((t) => ({
            OR: [
              { firstName: { contains: t, mode: 'insensitive' as const } },
              { lastName: { contains: t, mode: 'insensitive' as const } },
              { email: { contains: t, mode: 'insensitive' as const } },
              { phone: { contains: t } },
            ],
          })),
        }),
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.membership.count({ where }),
      this.prisma.membership.findMany({
        where,
        skip,
        take,
        orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              staffProfiles: { where: { tenantId, deletedAt: null }, select: { id: true }, take: 1 },
              parents: { where: { tenantId, deletedAt: null }, select: { id: true }, take: 1 },
              students: { where: { tenantId, deletedAt: null }, select: { id: true }, take: 1 },
            },
          },
          roles: { select: { role: { select: { code: true, name: true } } } },
        },
      }),
    ]);

    const data = rows.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      phone: m.user.phone,
      status: m.status,
      roles: m.roles.map((r) => ({ code: r.role.code, name: r.role.name })),
      profileType: (m.user.staffProfiles.length
        ? 'STAFF'
        : m.user.parents.length
          ? 'PARENT'
          : m.user.students.length
            ? 'STUDENT'
            : 'USER') as 'STAFF' | 'PARENT' | 'STUDENT' | 'USER',
      createdAt: m.createdAt,
    }));

    return paginated(data, total, page, limit);
  }

  async setRoles(user: AuthUser, membershipId: string, dto: SetMemberRolesDto) {
    const membership = await this.findOrThrow(user.tenantId, membershipId);
    const codes = [...new Set(dto.roleCodes.map((c) => c.trim().toUpperCase()))];

    const roles = await this.prisma.role.findMany({
      where: { tenantId: user.tenantId, code: { in: codes } },
      select: { id: true, code: true },
    });
    if (roles.length !== codes.length) {
      const known = new Set(roles.map((r) => r.code));
      throw new BadRequestException(`Unknown role(s): ${codes.filter((c) => !known.has(c)).join(', ')}`);
    }

    const before = membership.roles.map((r) => r.role.code);
    const wasAdmin = before.includes(ADMIN_ROLE_CODE);
    const willBeAdmin = codes.includes(ADMIN_ROLE_CODE);

    if (wasAdmin && !willBeAdmin && membershipId === user.membershipId) {
      throw new BadRequestException('You cannot remove your own Administrator role');
    }

    await this.prisma.$transaction(async (tx) => {
      if (wasAdmin && !willBeAdmin && membership.status === 'ACTIVE') {
        await this.assertAnotherActiveAdmin(tx, user.tenantId, membershipId);
      }
      await tx.membershipRole.deleteMany({ where: { membershipId } });
      await tx.membershipRole.createMany({
        data: roles.map((r) => ({ membershipId, roleId: r.id })),
        skipDuplicates: true,
      });
      await this.audit.log(
        user,
        'UPDATE_ROLES',
        'Membership',
        membershipId,
        { user: membership.user.email, from: before, to: codes },
        tx,
      );
    });

    return { membershipId, roles: codes };
  }

  async setStatus(user: AuthUser, membershipId: string, dto: SetMemberStatusDto) {
    if (membershipId === user.membershipId) {
      throw new BadRequestException('You cannot change the status of your own account');
    }
    const membership = await this.findOrThrow(user.tenantId, membershipId);
    if (membership.status === dto.status) {
      return { membershipId, status: membership.status };
    }

    const isAdmin = membership.roles.some((r) => r.role.code === ADMIN_ROLE_CODE);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status === 'SUSPENDED' && isAdmin && membership.status === 'ACTIVE') {
        await this.assertAnotherActiveAdmin(tx, user.tenantId, membershipId);
      }
      const result = await tx.membership.update({ where: { id: membershipId }, data: { status: dto.status } });
      await this.audit.log(
        user,
        dto.status === 'SUSPENDED' ? 'SUSPEND' : 'ACTIVATE',
        'Membership',
        membershipId,
        { user: membership.user.email, from: membership.status, to: dto.status },
        tx,
      );
      return result;
    });

    return { membershipId, status: updated.status };
  }

  // Issues a one-time temporary password (must be changed at next login).
  // Not for your own account (use My Account → change password), and only an
  // administrator may reset another administrator.
  async resetPassword(user: AuthUser, membershipId: string) {
    if (membershipId === user.membershipId) {
      throw new BadRequestException('Use My Account → Change password for your own account');
    }
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId: user.tenantId },
      select: {
        user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
        roles: { select: { role: { select: { code: true } } } },
      },
    });
    if (!membership) throw new NotFoundException('User not found in this school');
    if (membership.roles.some((r) => r.role.code === ADMIN_ROLE_CODE) && !user.isAdmin) {
      throw new ForbiddenException("Only an administrator can reset another administrator's password");
    }

    const temporaryPassword = await this.credentials.setTemporaryPassword(user.tenantId, membership.user.id);
    await this.audit.log(user, 'RESET_PASSWORD', 'Membership', membershipId, { user: membership.user.email });
    return {
      membershipId,
      name: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
      loginId: await this.credentials.loginIdForUser(user.tenantId, membership.user),
      temporaryPassword,
    };
  }

  // The school must always keep at least one active administrator.
  private async assertAnotherActiveAdmin(tx: Tx, tenantId: string, excludeMembershipId: string) {
    const others = await tx.membership.count({
      where: {
        tenantId,
        id: { not: excludeMembershipId },
        status: 'ACTIVE',
        user: { deletedAt: null, isActive: true },
        roles: { some: { role: { code: ADMIN_ROLE_CODE } } },
      },
    });
    if (others === 0) {
      throw new BadRequestException('The school must keep at least one active administrator');
    }
  }

  private async findOrThrow(tenantId: string, id: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        user: { select: { email: true } },
        roles: { select: { role: { select: { code: true } } } },
      },
    });
    if (!membership) throw new NotFoundException('User not found in this school');
    return membership;
  }
}
