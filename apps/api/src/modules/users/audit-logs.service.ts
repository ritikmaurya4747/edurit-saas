import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { getPagination, paginated } from '../../common/utils/pagination';
import { parseDateOnly } from '../../common/utils/date';
import { zonedDayStart } from '../dashboard/utils/zoned-time';
import { ListAuditLogsQueryDto } from './dto/users.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: ListAuditLogsQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const timezone = await this.timezone(tenantId);

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = zonedDayStart(parseDateOnly(query.from), timezone);
    if (query.to) {
      const to = parseDateOnly(query.to);
      to.setUTCDate(to.getUTCDate() + 1);
      createdAt.lt = zonedDayStart(to, timezone);
    }
    if (createdAt.gte && createdAt.lt && createdAt.gte >= createdAt.lt) {
      throw new BadRequestException("'From' date must be on or before the 'To' date");
    }

    const search = query.search?.trim();
    const where: Prisma.TenantAuditLogWhereInput = {
      tenantId,
      ...(query.entityName && { entityName: { equals: query.entityName, mode: 'insensitive' } }),
      ...(query.action && { action: { equals: query.action, mode: 'insensitive' } }),
      ...(query.userId && { userId: query.userId }),
      ...((createdAt.gte || createdAt.lt) && { createdAt }),
      ...(search && {
        OR: [
          { entityName: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.tenantAuditLog.count({ where }),
      this.prisma.tenantAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityName: true,
          entityId: true,
          changes: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityName: r.entityName,
      entityId: r.entityId,
      changes: r.changes,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
      userId: r.user?.id ?? null,
      userName: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : 'System',
      userEmail: r.user?.email ?? null,
    }));

    return paginated(data, total, page, limit);
  }

  // Distinct entity names and actions recorded for this school (filter dropdowns).
  async facets(tenantId: string) {
    const [entities, actions] = await Promise.all([
      this.prisma.tenantAuditLog.groupBy({
        by: ['entityName'],
        where: { tenantId },
        orderBy: { entityName: 'asc' },
        take: 200,
      }),
      this.prisma.tenantAuditLog.groupBy({
        by: ['action'],
        where: { tenantId },
        orderBy: { action: 'asc' },
        take: 200,
      }),
    ]);
    return { entityNames: entities.map((e) => e.entityName), actions: actions.map((a) => a.action) };
  }

  private async timezone(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timezone: true } });
    return settings?.timezone || 'Asia/Kolkata';
  }
}
