import { PrismaClient, PlatformRole } from '../generated/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATALOGUE,
  REVOKED_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from '../src/index';

const prisma = new PrismaClient();

// Ensures every tenant has all system roles and keeps their defaults current
// without overwriting an admin's custom edits:
//  - a role with no permissions yet gets its full default set;
//  - ADMIN always gets every catalogue permission;
//  - permissions introduced in THIS run (newCodes) are granted to the system
//    roles whose defaults include them (so new modules show up for teachers,
//    staff, ...), while permissions an admin removed earlier stay removed;
//  - REVOKED_ROLE_PERMISSIONS are removed from those system roles.
async function syncTenantSystemRoles(newCodes: Set<string>) {
  const permissions = await prisma.permission.findMany();
  const permissionIdByCode = new Map(permissions.map((p) => [p.code, p.id]));
  const tenants = await prisma.tenant.findMany({ select: { id: true, slug: true } });

  for (const tenant of tenants) {
    for (const systemRole of SYSTEM_ROLES) {
      const role = await prisma.role.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: systemRole.code } },
        update: {},
        create: {
          tenantId: tenant.id,
          code: systemRole.code,
          name: systemRole.name,
          isSystem: true,
        },
        include: { _count: { select: { permissions: true } } },
      });

      const defaults = DEFAULT_ROLE_PERMISSIONS[systemRole.code] ?? [];
      const isFresh = role._count.permissions === 0 || systemRole.code === 'ADMIN';
      const toGrant = isFresh ? defaults : defaults.filter((code) => newCodes.has(code));

      const data = toGrant
        .map((code) => permissionIdByCode.get(code))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId }));
      if (data.length > 0) {
        await prisma.rolePermission.createMany({ data, skipDuplicates: true });
      }

      const revokeIds = (REVOKED_ROLE_PERMISSIONS[systemRole.code] ?? [])
        .map((code) => permissionIdByCode.get(code))
        .filter((id): id is string => Boolean(id));
      if (revokeIds.length > 0) {
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { in: revokeIds } } });
      }
    }
    console.log(`✅ Synced system roles for tenant '${tenant.slug}'.`);
  }
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Master Permissions (remember which ones are new in this run)
  const existingCodes = new Set((await prisma.permission.findMany({ select: { code: true } })).map((p) => p.code));
  const newCodes = new Set(PERMISSION_CATALOGUE.map((p) => p.code).filter((code) => !existingCodes.has(code)));
  for (const perm of PERMISSION_CATALOGUE) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ Seeded ${PERMISSION_CATALOGUE.length} master permissions.`);

  // 2. Seed Default Subscription Plans
  await prisma.subscriptionPlan.upsert({
    where: { code: 'FREE_TRIAL' },
    update: {},
    create: {
      code: 'FREE_TRIAL',
      name: '14-Day Free Trial',
      maxStudents: 50,
      maxStaff: 10,
      pricePerYear: 0.0,
      featuresJson: { lms: true, billing: true, exams: true },
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO_STANDARD' },
    update: {},
    create: {
      code: 'PRO_STANDARD',
      name: 'Pro Standard School',
      maxStudents: 1000,
      maxStaff: 100,
      pricePerYear: 49999.0,
      featuresJson: { lms: true, billing: true, exams: true, customDomain: true },
    },
  });
  console.log('✅ Seeded default subscription plans.');

  // 3. Seed Platform SuperAdmin
  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  await prisma.platformUser.upsert({
    where: { email: 'superadmin@edurit.com' },
    update: {},
    create: {
      email: 'superadmin@edurit.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: PlatformRole.SUPER_ADMIN,
    },
  });
  console.log('✅ Super Admin created: superadmin@edurit.com / Admin@123456');

  // 4. Backfill system roles + default permissions for existing tenants
  await syncTenantSystemRoles(newCodes);

  console.log('🌾 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
