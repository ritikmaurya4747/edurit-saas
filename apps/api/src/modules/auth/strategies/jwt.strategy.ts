import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ADMIN_ROLE_CODE } from '@edurit/database';
import { PrismaService } from '../../../core/database/prisma.service';
import type { AuthUser } from '../../../common/types/auth-user';

export interface TenantJwtPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: TenantJwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        deletedAt: true,
        memberships: {
          where: { tenantId: payload.tenantId, status: 'ACTIVE' },
          select: {
            id: true,
            roles: {
              select: {
                role: {
                  select: {
                    code: true,
                    permissions: { select: { permission: { select: { code: true } } } },
                  },
                },
              },
            },
          },
        },
        staffProfiles: {
          where: { tenantId: payload.tenantId, deletedAt: null },
          select: { id: true },
        },
      },
    });

    const membership = user?.memberships[0];
    if (!user || !user.isActive || user.deletedAt || !membership) {
      throw new UnauthorizedException('User account is suspended, inactive, or unauthorized for this school.');
    }

    const roles = membership.roles.map((mr) => mr.role.code);
    const permissions = [
      ...new Set(membership.roles.flatMap((mr) => mr.role.permissions.map((rp) => rp.permission.code))),
    ];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: payload.tenantId,
      membershipId: membership.id,
      roles,
      permissions,
      isAdmin: roles.includes(ADMIN_ROLE_CODE),
      staffId: user.staffProfiles[0]?.id ?? null,
    };
  }
}
