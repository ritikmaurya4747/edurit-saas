import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import * as bcrypt from "bcrypt";
import {
  ADMIN_ROLE_CODE,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  SubscriptionStatus,
} from "@edurit/database";

@Injectable()
export class PlatformTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tenant Provisioning Pipeline
  async createTenant(dto: CreateTenantDto, platformUserId: string) {
    const normalizedSlug = dto.slug.toLowerCase().trim();

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
    });
    if (existingTenant) {
      throw new ConflictException(
        `Tenant slug '${normalizedSlug}' is already taken`,
      );
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: dto.planCode || "FREE_TRIAL" },
    });
    if (!plan) {
      throw new NotFoundException(
        `Subscription plan '${dto.planCode}' not found`,
      );
    }

    const isTrial = plan.code === "FREE_TRIAL";
    const now = new Date();
    const endDate = new Date(now);

    if (isTrial) {
      endDate.setDate(endDate.getDate() + 14);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscriptionStatus = isTrial
      ? SubscriptionStatus.TRIAL
      : SubscriptionStatus.ACTIVE;

    const tempPassword = dto.adminInitialPassword || "School@123456";
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const masterPermissions = await this.prisma.permission.findMany();

    return this.prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            slug: normalizedSlug,
            name: dto.name.trim(),
            legalName: dto.legalName?.trim() || null,
          },
        });

        await tx.tenantSettings.create({
          data: {
            tenantId: tenant.id,
            currency: dto.currency || "INR",
            timezone: dto.timezone || "Asia/Kolkata",
          },
        });

        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: subscriptionStatus,
            startDate: now,
            endDate: endDate,
            autoRenew: !isTrial,
          },
        });

        const mainBranch = await tx.branch.create({
          data: {
            tenantId: tenant.id,
            name: "Main Campus",
            code: "MAIN",
          },
        });

        // System roles with their default permission sets (see @edurit/database rbac)
        const permissionIdByCode = new Map(masterPermissions.map((p) => [p.code, p.id]));
        let adminRoleId = "";
        for (const systemRole of SYSTEM_ROLES) {
          const role = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: systemRole.name,
              code: systemRole.code,
              isSystem: true,
            },
          });
          if (systemRole.code === ADMIN_ROLE_CODE) adminRoleId = role.id;

          const data = (DEFAULT_ROLE_PERMISSIONS[systemRole.code] ?? [])
            .map((code) => permissionIdByCode.get(code))
            .filter((id): id is string => Boolean(id))
            .map((permissionId) => ({ roleId: role.id, permissionId }));
          if (data.length > 0) {
            await tx.rolePermission.createMany({ data });
          }
        }

        // Current academic session (Indian schools: April → March)
        const sessionStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        await tx.academicYear.create({
          data: {
            tenantId: tenant.id,
            name: `${sessionStartYear}-${String(sessionStartYear + 1).slice(-2)}`,
            startDate: new Date(Date.UTC(sessionStartYear, 3, 1)),
            endDate: new Date(Date.UTC(sessionStartYear + 1, 2, 31)),
            isCurrent: true,
          },
        });

        const adminUser = await tx.user.upsert({
          where: { email: dto.adminEmail.toLowerCase().trim() },
          update: {},
          create: {
            email: dto.adminEmail.toLowerCase().trim(),
            passwordHash,
            firstName: dto.adminFirstName.trim(),
            lastName: dto.adminLastName.trim(),
          },
        });

        const membership = await tx.membership.create({
          data: {
            tenantId: tenant.id,
            userId: adminUser.id,
          },
        });

        await tx.membershipRole.create({
          data: {
            membershipId: membership.id,
            roleId: adminRoleId,
          },
        });

        await tx.platformAuditLog.create({
          data: {
            platformUserId,
            targetTenantId: tenant.id,
            action: "TENANT_PROVISIONED",
            entityName: "Tenant",
            entityId: tenant.id,
            changes: {
              slug: tenant.slug,
              name: tenant.name,
              plan: plan.code,
              adminEmail: adminUser.email,
              status: subscriptionStatus,
              expiresAt: endDate,
            },
          },
        });

        return {
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
          },
          mainBranch: {
            id: mainBranch.id,
            name: mainBranch.name,
            code: mainBranch.code,
          },
          adminUser: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            temporaryPassword: tempPassword,
          },
          subscription: {
            planName: plan.name,
            planCode: plan.code,
            status: subscriptionStatus,
            expiresAt: endDate,
          },
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  }

  // List All Provisioned Tenants (Paginated)
  async listTenants(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { slug: { contains: query.search, mode: "insensitive" as const } },
          ],
          deletedAt: null,
        }
      : { deletedAt: null };

    const [total, data] = await Promise.all([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          settings: true,
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              students: true,
              staff: true,
              branches: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}