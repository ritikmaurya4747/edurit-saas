import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryItem, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import {
  AdjustStockDto,
  CreateInventoryItemDto,
  InventoryListQueryDto,
  UpdateInventoryItemDto,
} from './dto/operations.dto';

const ENTITY = 'InventoryItem';
const normaliseSku = (sku: string) => sku.trim().toUpperCase();

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Items at or below their reorder level (column-to-column comparison).
  lowStockWhere(): Prisma.InventoryItemWhereInput {
    return { quantity: { lte: this.prisma.inventoryItem.fields.reorderLevel } };
  }

  async list(tenantId: string, query: InventoryListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = query.search?.trim();
    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      deletedAt: null,
      ...(query.lowStock && this.lowStockWhere()),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return paginated(rows.map(this.toView), total, page, limit);
  }

  async create(user: AuthUser, dto: CreateInventoryItemDto) {
    const sku = normaliseSku(dto.sku);
    await this.assertSkuFree(user.tenantId, sku);
    const item = await this.prisma.inventoryItem.create({
      data: {
        tenantId: user.tenantId,
        sku,
        name: dto.name.trim(),
        quantity: dto.quantity ?? 0,
        reorderLevel: dto.reorderLevel ?? 5,
      },
    });
    await this.audit.log(user, 'CREATE', ENTITY, item.id, {
      sku,
      name: item.name,
      before: 0,
      after: item.quantity,
      reason: 'Opening stock',
    });
    return this.toView(item);
  }

  async update(user: AuthUser, id: string, dto: UpdateInventoryItemDto) {
    const item = await this.findOrThrow(user.tenantId, id);
    const sku = dto.sku !== undefined ? normaliseSku(dto.sku) : undefined;
    if (sku && sku !== item.sku) await this.assertSkuFree(user.tenantId, sku);
    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { sku, name: dto.name?.trim(), reorderLevel: dto.reorderLevel },
    });
    await this.audit.log(user, 'UPDATE', ENTITY, id, { ...dto, ...(sku && { sku }) });
    return this.toView(updated);
  }

  // Atomic stock movement: the conditional update guarantees stock never goes
  // negative even with concurrent adjustments.
  async adjust(user: AuthUser, id: string, dto: AdjustStockDto) {
    const reason = dto.reason.trim();
    if (!reason) throw new BadRequestException('Please give a reason for the adjustment');

    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ where: { id, tenantId: user.tenantId, deletedAt: null } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const result = await tx.inventoryItem.updateMany({
        where: { id, tenantId: user.tenantId, deletedAt: null, ...(dto.delta < 0 && { quantity: { gte: -dto.delta } }) },
        data: { quantity: { increment: dto.delta } },
      });
      if (result.count === 0) {
        throw new BadRequestException(
          `Only ${item.quantity} unit(s) of ${item.name} in stock — cannot remove ${Math.abs(dto.delta)}`,
        );
      }

      const after = await tx.inventoryItem.findUniqueOrThrow({ where: { id } });
      await this.audit.log(
        user,
        'ADJUST_STOCK',
        ENTITY,
        id,
        { sku: after.sku, name: after.name, before: after.quantity - dto.delta, after: after.quantity, delta: dto.delta, reason },
        tx,
      );
      return after;
    });
    return this.toView(updated);
  }

  // Soft delete; the SKU is suffixed so it can be reused (unique per tenant).
  async remove(user: AuthUser, id: string) {
    const item = await this.findOrThrow(user.tenantId, id);
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), sku: `${item.sku}~${Date.now().toString(36)}`.slice(0, 64) },
    });
    await this.audit.log(user, 'DELETE', ENTITY, id, { sku: item.sku, name: item.name, quantity: item.quantity });
    return { id, deleted: true };
  }

  async history(tenantId: string, id: string) {
    await this.findOrThrow(tenantId, id);
    const logs = await this.prisma.tenantAuditLog.findMany({
      where: { tenantId, entityName: ENTITY, entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      changes: log.changes,
      createdAt: log.createdAt,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : null,
    }));
  }

  private toView = (item: InventoryItem) => ({ ...item, lowStock: item.quantity <= item.reorderLevel });

  private async assertSkuFree(tenantId: string, sku: string) {
    const clash = await this.prisma.inventoryItem.findFirst({ where: { tenantId, sku }, select: { name: true } });
    if (clash) throw new ConflictException(`SKU ${sku} is already used by "${clash.name}"`);
  }

  private async findOrThrow(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }
}
