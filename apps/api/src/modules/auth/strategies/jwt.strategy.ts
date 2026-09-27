import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service'; 

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

  async validate(payload: TenantJwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { 
            tenantId: payload.tenantId, 
            status: 'ACTIVE' 
          }
        }
      }
    });

    if (!user || !user.isActive || user.deletedAt || user.memberships.length === 0) {
      throw new UnauthorizedException('User account is suspended, inactive, or unauthorized for this school.');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: payload.roles,
      tenantId: payload.tenantId, 
    };
  }
}