import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { BillingContextService } from './billing-context.service';
import { fromPaise, paiseToNumber, toPaise } from './billing.utils';
import { CreateFeeStructureDto, FeeComponentInputDto, UpdateFeeStructureDto } from './dto/billing.dto';

const structureInclude = {
  academicYear: { select: { id: true, name: true, isCurrent: true } },
  components: { orderBy: { name: 'asc' as const } },
};

@Injectable()
export class FeeStructuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly context: BillingContextService,
  ) {}

  async list(tenantId: string, academicYearId?: string) {
    const yearId = await this.context.yearIdOrCurrent(tenantId, academicYearId);
    if (!yearId) return [];
    const structures = await this.prisma.feeStructure.findMany({
      where: { tenantId, academicYearId: yearId, deletedAt: null },
      include: structureInclude,
      orderBy: { name: 'asc' },
    });
    return structures.map((s) => this.withTotal(s));
  }

  async get(tenantId: string, id: string) {
    const structure = await this.prisma.feeStructure.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: structureInclude,
    });
    if (!structure) throw new NotFoundException('Fee structure not found');
    return this.withTotal(structure);
  }

  async create(user: AuthUser, dto: CreateFeeStructureDto) {
    const academicYearId = await this.context.requireYearId(user.tenantId, dto.academicYearId);
    const components = this.normalizeComponents(dto.components);
    const structure = await this.prisma.feeStructure.create({
      data: {
        tenantId: user.tenantId,
        academicYearId,
        name: dto.name.trim(),
        components: { create: components.map((c) => ({ name: c.name, amount: fromPaise(c.amountPaise) })) },
      },
    });
    await this.audit.log(user, 'CREATE', 'FeeStructure', structure.id, {
      name: structure.name,
      components: components.map((c) => ({ name: c.name, amount: paiseToNumber(c.amountPaise) })),
    });
    return this.get(user.tenantId, structure.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateFeeStructureDto) {
    const existing = await this.get(user.tenantId, id);
    const components = dto.components ? this.normalizeComponents(dto.components) : null;

    await this.prisma.$transaction(async (tx) => {
      if (dto.name !== undefined) {
        await tx.feeStructure.update({ where: { id }, data: { name: dto.name.trim() } });
      }
      if (!components) return;

      // Replace the component set. Components are matched by id (or by name)
      // so invoices already linked to them keep their reference.
      const byId = new Map(existing.components.map((c) => [c.id, c]));
      const byName = new Map(existing.components.map((c) => [c.name.toLowerCase(), c]));
      const kept = new Set<string>();
      for (const c of components) {
        const match = (c.id && byId.get(c.id)) || byName.get(c.name.toLowerCase());
        if (match && !kept.has(match.id)) {
          kept.add(match.id);
          await tx.feeComponent.update({ where: { id: match.id }, data: { name: c.name, amount: fromPaise(c.amountPaise) } });
        } else {
          await tx.feeComponent.create({ data: { feeStructureId: id, name: c.name, amount: fromPaise(c.amountPaise) } });
        }
      }
      const removed = existing.components.filter((c) => !kept.has(c.id)).map((c) => c.id);
      if (removed.length) await tx.feeComponent.deleteMany({ where: { id: { in: removed }, feeStructureId: id } });
    });

    await this.audit.log(user, 'UPDATE', 'FeeStructure', id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(components && { components: components.map((c) => ({ name: c.name, amount: paiseToNumber(c.amountPaise) })) }),
    });
    return this.get(user.tenantId, id);
  }

  async remove(user: AuthUser, id: string) {
    const structure = await this.get(user.tenantId, id);
    await this.prisma.feeStructure.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'FeeStructure', id, { name: structure.name });
    return { id, deleted: true };
  }

  private normalizeComponents(components: FeeComponentInputDto[]) {
    const seen = new Set<string>();
    return components.map((c) => {
      const name = c.name.trim();
      const key = name.toLowerCase();
      if (seen.has(key)) throw new BadRequestException(`Fee component "${name}" is listed twice`);
      seen.add(key);
      const amountPaise = toPaise(c.amount);
      if (amountPaise <= 0) throw new BadRequestException(`Amount for "${name}" must be greater than zero`);
      return { id: c.id, name, amountPaise };
    });
  }

  private withTotal<T extends { components: { amount: unknown }[] }>(structure: T) {
    const totalPaise = structure.components.reduce((sum, c) => sum + toPaise(c.amount as string), 0);
    return { ...structure, totalAmount: fromPaise(totalPaise).toFixed(2) };
  }
}
