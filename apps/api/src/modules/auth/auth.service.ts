// apps/api/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantsLoginDto } from './dto/tenants-login.dto';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(tenantsLoginDto: TenantsLoginDto) {
    const { email, password, tenantSlug } = tenantsLoginDto;

    // 1. Verify Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('School not found. Please check the URL.');
    }

    // 2. Find user via ACTIVE Membership in this specific tenant, and include their roles
    const user = await this.prisma.user.findFirst({
      where: { 
        email,
        memberships: {
          some: {
            tenantId: tenant.id,
            status: 'ACTIVE' 
          }
        }
      },
      include: {
        memberships: {
          where: { tenantId: tenant.id },
          include: {
            roles: {
              include: { role: true }
            }
          }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      throw new UnauthorizedException('Invalid credentials for this school.');
    }

    // 3. Compare with passwordHash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 4. Extract Role Codes (e.g., ['ADMIN', 'TEACHER'])
    const userRoles = user.memberships[0].roles.map(mr => mr.role.code);

    // 5. Generate JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: userRoles, // Passing an array of roles instead of a single static string
      tenantId: tenant.id 
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
        name: tenant.name
      }
    };
  }
}