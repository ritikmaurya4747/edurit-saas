import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { PROFILE_FIELDS, UpdateSchoolSettingsDto } from './dto/tenants.dto';

type ProfileField = (typeof PROFILE_FIELDS)[number];
export type SchoolProfile = Record<ProfileField, string>;

const DAY_MS = 24 * 60 * 60 * 1000;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function isValidTimeZone(timeZone: string): boolean {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  if (typeof intl.supportedValuesOf === 'function') {
    try {
      if (intl.supportedValuesOf('timeZone').includes(timeZone) || timeZone === 'UTC') return true;
    } catch {
      // fall through to the constructor check
    }
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getSchool(tenantId: string) {
    const [tenant, subscription, students, staff, branches, classes] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: { id: tenantId, deletedAt: null },
        select: {
          id: true,
          name: true,
          legalName: true,
          slug: true,
          status: true,
          settings: {
            select: { currency: true, timezone: true, logoUrl: true, customDomain: true, themeConfig: true },
          },
        },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: { tenantId },
        orderBy: [{ endDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          status: true,
          startDate: true,
          endDate: true,
          autoRenew: true,
          plan: { select: { name: true, code: true, maxStudents: true, maxStaff: true } },
        },
      }),
      this.prisma.student.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.branch.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.class.count({ where: { tenantId, deletedAt: null } }),
    ]);
    if (!tenant) throw new NotFoundException('School not found');

    const theme = isPlainObject(tenant.settings?.themeConfig) ? tenant.settings.themeConfig : {};
    const storedProfile = isPlainObject(theme.profile) ? theme.profile : {};
    const profile = Object.fromEntries(
      PROFILE_FIELDS.map((f) => [f, typeof storedProfile[f] === 'string' ? (storedProfile[f] as string) : '']),
    ) as SchoolProfile;

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        legalName: tenant.legalName,
        slug: tenant.slug,
        status: tenant.status,
      },
      settings: {
        currency: tenant.settings?.currency ?? 'INR',
        timezone: tenant.settings?.timezone ?? 'Asia/Kolkata',
        logoUrl: tenant.settings?.logoUrl ?? null,
        customDomain: tenant.settings?.customDomain ?? null,
      },
      profile,
      subscription: subscription
        ? {
            planName: subscription.plan.name,
            planCode: subscription.plan.code,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            autoRenew: subscription.autoRenew,
            maxStudents: subscription.plan.maxStudents,
            maxStaff: subscription.plan.maxStaff,
            daysRemaining: Math.max(0, Math.ceil((subscription.endDate.getTime() - Date.now()) / DAY_MS)),
          }
        : null,
      usage: { students, staff, branches, classes },
    };
  }

  async updateSchool(user: AuthUser, dto: UpdateSchoolSettingsDto) {
    if (dto.timezone !== undefined && !isValidTimeZone(dto.timezone)) {
      throw new BadRequestException(`'${dto.timezone}' is not a valid timezone (e.g. Asia/Kolkata)`);
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: user.tenantId, deletedAt: null },
      select: { id: true, name: true, legalName: true, settings: true },
    });
    if (!tenant) throw new NotFoundException('School not found');

    const changes: Record<string, unknown> = {};
    const tenantData: Prisma.TenantUpdateInput = {};
    if (dto.name !== undefined && dto.name !== tenant.name) {
      tenantData.name = dto.name;
      changes.name = { from: tenant.name, to: dto.name };
    }
    if (dto.legalName !== undefined && (dto.legalName || null) !== tenant.legalName) {
      tenantData.legalName = dto.legalName || null;
      changes.legalName = { from: tenant.legalName, to: dto.legalName || null };
    }

    const settings = tenant.settings;
    const settingsData: Prisma.TenantSettingsUncheckedUpdateInput = {};
    if (dto.currency !== undefined && dto.currency !== settings?.currency) {
      settingsData.currency = dto.currency;
      changes.currency = { from: settings?.currency ?? null, to: dto.currency };
    }
    if (dto.timezone !== undefined && dto.timezone !== settings?.timezone) {
      settingsData.timezone = dto.timezone;
      changes.timezone = { from: settings?.timezone ?? null, to: dto.timezone };
    }
    if (dto.logoUrl !== undefined && (dto.logoUrl || null) !== (settings?.logoUrl ?? null)) {
      settingsData.logoUrl = dto.logoUrl || null;
      changes.logoUrl = dto.logoUrl || null;
    }
    if (dto.profile) {
      const theme = isPlainObject(settings?.themeConfig) ? settings.themeConfig : {};
      const current = isPlainObject(theme.profile) ? theme.profile : {};
      const next: Record<string, unknown> = { ...current };
      const profileChanges: Record<string, unknown> = {};
      for (const field of PROFILE_FIELDS) {
        const value = dto.profile[field];
        if (value === undefined) continue;
        if ((current[field] ?? '') !== value) profileChanges[field] = value;
        next[field] = value;
      }
      if (Object.keys(profileChanges).length) {
        settingsData.themeConfig = { ...theme, profile: next } as Prisma.InputJsonObject;
        changes.profile = profileChanges;
      }
    }

    if (Object.keys(changes).length) {
      await this.prisma.$transaction(async (tx) => {
        if (Object.keys(tenantData).length) {
          await tx.tenant.update({ where: { id: user.tenantId }, data: tenantData });
        }
        if (Object.keys(settingsData).length) {
          await tx.tenantSettings.upsert({
            where: { tenantId: user.tenantId },
            update: settingsData,
            create: {
              tenantId: user.tenantId,
              ...(settingsData.currency !== undefined && { currency: settingsData.currency as string }),
              ...(settingsData.timezone !== undefined && { timezone: settingsData.timezone as string }),
              ...(settingsData.logoUrl !== undefined && { logoUrl: settingsData.logoUrl as string | null }),
              ...(settingsData.themeConfig !== undefined && {
                themeConfig: settingsData.themeConfig as Prisma.InputJsonObject,
              }),
            },
          });
        }
        await this.audit.log(user, 'UPDATE', 'TenantSettings', user.tenantId, changes, tx);
      });
    }

    return this.getSchool(user.tenantId);
  }
}
