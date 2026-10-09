import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_CODE, PERMISSION_CATALOGUE, SYSTEM_ROLES } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateRoleDto, UpdateRoleDto } from './dto/users.dto';

// Stable ordering helpers based on the shared catalogue (rbac.ts).
const CATALOGUE_INDEX = new Map(PERMISSION_CATALOGUE.map((p, i) => [p.code, i]));
const MODULE_ORDER: string[] = [...new Set(PERMISSION_CATALOGUE.map((p) => p.module))];
const SYSTEM_ORDER = new Map(SYSTEM_ROLES.map((r, i) => [r.code, i]));

const permissionRank = (code: string) => CATALOGUE_INDEX.get(code) ?? Number.MAX_SAFE_INTEGER;
const moduleRank = (module: string) => {
  const i = MODULE_ORDER.indexOf(module);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

// "Transport Head" → "TRANSPORT_HEAD"
export const toRoleCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Permission catalogue grouped by module, in catalogue order.
  async listPermissions() {
    const permissions = await this.prisma.permission.findMany({
      select: { id: true, code: true, module: true, description: true },
    });
    permissions.sort((a, b) => permissionRank(a.code) - permissionRank(b.code) || a.code.localeCompare(b.code));

    const groups = new Map<string, { id: string; code: string; description: string | null }[]>();
    for (const p of permissions) {
      if (!groups.has(p.module)) groups.set(p.module, []);
      groups.get(p.module)!.push({ id: p.id, code: p.code, description: p.description });
    }
    return [...groups.entries()]
      .sort(([a], [b]) => moduleRank(a) - moduleRank(b) || a.localeCompare(b))
      .map(([module, items]) => ({ module, permissions: items }));
  }

  async listRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        isSystem: true,
        _count: { select: { memberships: true } },
        permissions: { select: { permission: { select: { code: true } } } },
      },
    });

    const rank = (r: { code: string; isSystem: boolean }) =>
      r.code === ADMIN_ROLE_CODE ? 0 : r.isSystem ? 1 : 2;

    return roles
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          (a.isSystem && b.isSystem
            ? (SYSTEM_ORDER.get(a.code) ?? 99) - (SYSTEM_ORDER.get(b.code) ?? 99)
            : 0) ||
          a.name.localeCompare(b.name),
      )
      .map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        isSystem: r.isSystem,
        memberCount: r._count.memberships,
        permissionCodes: r.permissions
          .map((rp) => rp.permission.code)
          .sort((a, b) => permissionRank(a) - permissionRank(b)),
      }));
  }

  async create(user: AuthUser, dto: CreateRoleDto) {
    const name = dto.name.trim();
    const code = toRoleCode(dto.code?.trim() || name);
    if (!code) throw new BadRequestException('Role name must contain at least one letter or number');
    if (SYSTEM_ROLES.some((r) => r.code === code)) {
      throw new BadRequestException(`'${code}' is reserved for a system role. Choose a different name or code.`);
    }

    const existing = await this.prisma.role.findFirst({
      where: { tenantId: user.tenantId, OR: [{ code }, { name: { equals: name, mode: 'insensitive' } }] },
      select: { code: true, name: true },
    });
    if (existing) {
      throw new ConflictException(
        existing.code === code
          ? `A role with code '${code}' already exists`
          : `A role named '${existing.name}' already exists`,
      );
    }

    const permissionIds = await this.resolvePermissionIds(dto.permissionCodes);

    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: { tenantId: user.tenantId, name, code, isSystem: false },
      });
      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: created.id, permissionId })),
          skipDuplicates: true,
        });
      }
      await this.audit.log(
        user,
        'CREATE',
        'Role',
        created.id,
        { name, code, permissionCodes: dto.permissionCodes },
        tx,
      );
      return created;
    });

    return this.getRole(user.tenantId, role.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateRoleDto) {
    const role = await this.findOrThrow(user.tenantId, id);
    const changes: Record<string, unknown> = {};

    const name = dto.name?.trim();
    if (name !== undefined && name !== role.name) {
      if (role.isSystem) throw new BadRequestException('System role names cannot be changed');
      const clash = await this.prisma.role.findFirst({
        where: { tenantId: user.tenantId, id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (clash) throw new ConflictException(`A role named '${name}' already exists`);
      changes.name = { from: role.name, to: name };
    }

    let permissionIds: string[] | null = null;
    if (dto.permissionCodes !== undefined) {
      if (role.code === ADMIN_ROLE_CODE) {
        throw new BadRequestException('The Administrator role always has every permission and cannot be edited');
      }
      permissionIds = await this.resolvePermissionIds(dto.permissionCodes);
      const before = role.permissions.map((rp) => rp.permission.code);
      const after = dto.permissionCodes;
      changes.added = after.filter((c) => !before.includes(c));
      changes.removed = before.filter((c) => !after.includes(c));
    }

    await this.prisma.$transaction(async (tx) => {
      if (changes.name) await tx.role.update({ where: { id }, data: { name } });
      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
            skipDuplicates: true,
          });
        }
      }
      await this.audit.log(user, 'UPDATE', 'Role', id, { code: role.code, ...changes }, tx);
    });

    return this.getRole(user.tenantId, id);
  }

  async remove(user: AuthUser, id: string) {
    const role = await this.findOrThrow(user.tenantId, id);
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    if (role._count.memberships > 0) {
      throw new BadRequestException(
        `${role._count.memberships} user(s) still have the '${role.name}' role. Reassign them before deleting it.`,
      );
    }
    await this.prisma.role.delete({ where: { id } });
    await this.audit.log(user, 'DELETE', 'Role', id, { name: role.name, code: role.code });
    return { id, deleted: true };
  }

  private async getRole(tenantId: string, id: string) {
    const roles = await this.listRoles(tenantId);
    return roles.find((r) => r.id === id);
  }

  private async findOrThrow(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { memberships: true } },
        permissions: { select: { permission: { select: { code: true } } } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // Validates that every code exists in the catalogue; returns permission ids.
  private async resolvePermissionIds(codes: string[]) {
    const unique = [...new Set(codes)];
    if (!unique.length) return [];
    const found = await this.prisma.permission.findMany({
      where: { code: { in: unique } },
      select: { id: true, code: true },
    });
    if (found.length !== unique.length) {
      const known = new Set(found.map((p) => p.code));
      const unknown = unique.filter((c) => !known.has(c));
      throw new BadRequestException(`Unknown permission(s): ${unknown.join(', ')}`);
    }
    return found.map((p) => p.id);
  }
}
