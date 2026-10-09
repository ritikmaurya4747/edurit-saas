import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateBranchDto, UpdateBranchDto } from './dto/academic.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            classes: { where: { deletedAt: null } },
            staff: { where: { deletedAt: null } },
            students: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async create(user: AuthUser, dto: CreateBranchDto) {
    const branch = await this.prisma.branch.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        address: dto.address ?? {},
      },
    });
    await this.audit.log(user, 'CREATE', 'Branch', branch.id, { name: branch.name, code: branch.code });
    return branch;
  }

  async update(user: AuthUser, id: string, dto: UpdateBranchDto) {
    await this.findOrThrow(user.tenantId, id);
    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        code: dto.code?.trim().toUpperCase(),
        address: dto.address,
      },
    });
    await this.audit.log(user, 'UPDATE', 'Branch', id, { ...dto });
    return branch;
  }

  async remove(user: AuthUser, id: string) {
    const branch = await this.findOrThrow(user.tenantId, id);
    const [classes, staff, students, branches] = await Promise.all([
      this.prisma.class.count({ where: { tenantId: user.tenantId, branchId: id, deletedAt: null } }),
      this.prisma.staff.count({ where: { tenantId: user.tenantId, branchId: id, deletedAt: null } }),
      this.prisma.student.count({ where: { tenantId: user.tenantId, branchId: id, deletedAt: null } }),
      this.prisma.branch.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
    ]);
    if (branches <= 1) throw new BadRequestException('A school must have at least one branch');
    if (classes || staff || students) {
      throw new BadRequestException('Branch still has classes, staff or students assigned and cannot be deleted');
    }
    await this.prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'Branch', id, { name: branch.name });
    return { id, deleted: true };
  }

  // Default branch for records created without an explicit branch.
  async resolveBranchId(tenantId: string, branchId?: string) {
    if (branchId) {
      await this.findOrThrow(tenantId, branchId);
      return branchId;
    }
    const branch = await this.prisma.branch.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!branch) throw new BadRequestException('No branch configured for this school');
    return branch.id;
  }

  private async findOrThrow(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }
}
