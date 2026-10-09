// apps/api/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantsLoginDto } from './dto/tenants-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from '../../core/database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(tenantsLoginDto: TenantsLoginDto) {
    const { password, tenantSlug } = tenantsLoginDto;
    const email = tenantsLoginDto.email.toLowerCase().trim();

    // 1. Verify Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('School not found. Please check the URL.');
    }
    if (tenant.status === 'SUSPENDED') {
      throw new UnauthorizedException('This school account is suspended. Please contact support.');
    }

    // 2. Find user via ACTIVE Membership in this specific tenant, and include their roles
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        memberships: {
          some: {
            tenantId: tenant.id,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        memberships: {
          where: { tenantId: tenant.id },
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!user || user.memberships.length === 0 || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials for this school.');
    }

    // 3. Compare with passwordHash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 4. Extract Role Codes (e.g., ['ADMIN', 'TEACHER'])
    const userRoles = user.memberships[0].roles.map((mr) => mr.role.code);

    // 5. Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      roles: userRoles, // Passing an array of roles instead of a single static string
      tenantId: tenant.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles: userRoles,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
    };
  }

  async getMe(authUser: AuthUser) {
    const { id: userId, tenantId } = authUser;
    const membership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: {
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: { select: { logoUrl: true, themeConfig: true, currency: true, timezone: true } },
          },
        },
        roles: { select: { role: { select: { name: true, code: true } } } },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return {
      user: {
        id: membership.user.id,
        email: membership.user.email,
        phone: membership.user.phone,
        avatarUrl: membership.user.avatarUrl,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        name: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
      },
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        logoUrl: membership.tenant.settings?.logoUrl ?? null,
        themeConfig: membership.tenant.settings?.themeConfig ?? {},
        currency: membership.tenant.settings?.currency ?? 'INR',
        timezone: membership.tenant.settings?.timezone ?? 'Asia/Kolkata',
      },
      roles: membership.roles.map((r) => r.role),
      permissions: authUser.permissions,
      isAdmin: authUser.isAdmin,
      staffId: authUser.staffId,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { changed: true };
  }
}
