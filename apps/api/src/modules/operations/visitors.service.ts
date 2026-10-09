import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { CreateVisitorDto, VisitorListQueryDto } from './dto/operations.dto';
import { getTenantTimezone, zonedRange } from './operations.utils';

@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: VisitorListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = query.search?.trim();
    const timezone = query.date ? await getTenantTimezone(this.prisma, tenantId) : null;

    const where: Prisma.VisitorWhereInput = {
      tenantId,
      ...(query.date && { checkIn: zonedRange(query.date, query.date, timezone!) }),
      ...(query.active && { checkOut: null }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { purpose: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.visitor.findMany({ where, orderBy: { checkIn: 'desc' }, skip, take }),
      this.prisma.visitor.count({ where }),
    ]);
    return paginated(data, total, page, limit);
  }

  async checkIn(user: AuthUser, dto: CreateVisitorDto) {
    const visitor = await this.prisma.visitor.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        purpose: dto.purpose.trim(),
        checkIn: new Date(),
      },
    });
    await this.audit.log(user, 'CHECK_IN', 'Visitor', visitor.id, { name: visitor.name, purpose: visitor.purpose });
    return visitor;
  }

  async checkOut(user: AuthUser, id: string) {
    const visitor = await this.prisma.visitor.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.checkOut) throw new BadRequestException(`${visitor.name} has already checked out`);
    const updated = await this.prisma.visitor.update({ where: { id }, data: { checkOut: new Date() } });
    await this.audit.log(user, 'CHECK_OUT', 'Visitor', id, { name: visitor.name });
    return updated;
  }
}
