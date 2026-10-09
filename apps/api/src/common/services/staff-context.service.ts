import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class StaffContextService {
  constructor(private readonly prisma: PrismaService) {}

  // Several records (attendance sessions, homework) must reference a Staff row.
  // School admins provisioned by the platform have no Staff profile, so one is
  // created on first use in the tenant's first branch.
  async resolveStaffId(user: AuthUser): Promise<string> {
    if (user.staffId) return user.staffId;

    const existing = await this.prisma.staff.findUnique({
      where: { tenantId_userId: { tenantId: user.tenantId, userId: user.id } },
      select: { id: true },
    });
    if (existing) return existing.id;

    const branch = await this.prisma.branch.findFirst({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!branch) throw new BadRequestException('Create a branch before performing this action');

    const staff = await this.prisma.staff.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        branchId: branch.id,
        employeeCode: `ADM-${user.id.slice(0, 8).toUpperCase()}`,
        isTeachingStaff: false,
        designation: user.isAdmin ? 'Administrator' : 'Staff',
        department: 'Administration',
      },
      select: { id: true },
    });
    return staff.id;
  }
}
