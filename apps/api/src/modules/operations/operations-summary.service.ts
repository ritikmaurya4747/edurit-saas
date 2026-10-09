import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { addDays, todayDateOnly } from '../../common/utils/date';
import { InventoryService } from './inventory.service';
import { getTenantTimezone, zonedRange } from './operations.utils';

@Injectable()
export class OperationsSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  // Front-office tiles. "Due soon" = due today..+30 days and not compliant;
  // overdue = due before today and not compliant (the two are disjoint).
  async summary(tenantId: string) {
    const timezone = await getTenantTimezone(this.prisma, tenantId);
    const today = todayDateOnly(timezone);
    const todayRange = zonedRange(today, today, timezone);
    const notCompliant = { tenantId, deletedAt: null, NOT: { status: 'COMPLIANT' } };

    const [visitorsInside, visitorsToday, infirmaryToday, lowStockCount, complianceDueSoon, complianceOverdue] =
      await Promise.all([
        this.prisma.visitor.count({ where: { tenantId, checkOut: null } }),
        this.prisma.visitor.count({ where: { tenantId, checkIn: todayRange } }),
        this.prisma.infirmaryVisit.count({ where: { tenantId, visitedAt: todayRange } }),
        this.prisma.inventoryItem.count({ where: { tenantId, deletedAt: null, ...this.inventory.lowStockWhere() } }),
        this.prisma.complianceRecord.count({ where: { ...notCompliant, dueDate: { gte: today, lte: addDays(today, 30) } } }),
        this.prisma.complianceRecord.count({ where: { ...notCompliant, dueDate: { lt: today } } }),
      ]);

    return { visitorsInside, visitorsToday, infirmaryToday, lowStockCount, complianceDueSoon, complianceOverdue };
  }
}
