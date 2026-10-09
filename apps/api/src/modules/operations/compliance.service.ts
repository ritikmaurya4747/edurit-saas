import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplianceRecord, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import { ComplianceListQueryDto, CreateComplianceDto, UpdateComplianceDto } from './dto/operations.dto';
import { getTenantTimezone } from './operations.utils';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: ComplianceListQueryDto) {
    const today = todayDateOnly(await getTenantTimezone(this.prisma, tenantId));
    const search = query.search?.trim();
    const complianceType = query.complianceType?.trim();
    const where: Prisma.ComplianceRecordWhereInput = {
      tenantId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(complianceType && { complianceType: { equals: complianceType, mode: 'insensitive' } }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(query.dueWithinDays !== undefined && {
        dueDate: { lte: addDays(today, query.dueWithinDays) },
        NOT: { status: 'COMPLIANT' },
      }),
    };
    const rows = await this.prisma.complianceRecord.findMany({ where, orderBy: [{ dueDate: 'asc' }, { title: 'asc' }] });
    return rows.map((r) => this.toView(r, today));
  }

  async create(user: AuthUser, dto: CreateComplianceDto) {
    const record = await this.prisma.complianceRecord.create({
      data: {
        tenantId: user.tenantId,
        title: dto.title.trim(),
        complianceType: dto.complianceType.trim().toUpperCase().replace(/\s+/g, '_'),
        dueDate: parseDateOnly(dto.dueDate),
        documentUrl: dto.documentUrl?.trim() || null,
        status: dto.status ?? 'PENDING',
      },
    });
    await this.audit.log(user, 'CREATE', 'ComplianceRecord', record.id, {
      title: record.title,
      complianceType: record.complianceType,
      dueDate: dto.dueDate,
    });
    return this.toView(record, await this.today(user.tenantId));
  }

  async update(user: AuthUser, id: string, dto: UpdateComplianceDto) {
    await this.findOrThrow(user.tenantId, id);
    const record = await this.prisma.complianceRecord.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        complianceType: dto.complianceType?.trim().toUpperCase().replace(/\s+/g, '_'),
        dueDate: dto.dueDate ? parseDateOnly(dto.dueDate) : undefined,
        documentUrl: dto.documentUrl === undefined ? undefined : dto.documentUrl?.trim() || null,
        status: dto.status,
      },
    });
    await this.audit.log(user, 'UPDATE', 'ComplianceRecord', id, { ...dto });
    return this.toView(record, await this.today(user.tenantId));
  }

  async remove(user: AuthUser, id: string) {
    const record = await this.findOrThrow(user.tenantId, id);
    await this.prisma.complianceRecord.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'ComplianceRecord', id, { title: record.title });
    return { id, deleted: true };
  }

  private async today(tenantId: string) {
    return todayDateOnly(await getTenantTimezone(this.prisma, tenantId));
  }

  private toView(record: ComplianceRecord, today: Date) {
    const daysUntilDue = Math.round((record.dueDate.getTime() - today.getTime()) / DAY_MS);
    return {
      ...record,
      daysUntilDue,
      isOverdue: daysUntilDue < 0 && record.status !== 'COMPLIANT',
    };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const record = await this.prisma.complianceRecord.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!record) throw new NotFoundException('Compliance record not found');
    return record;
  }
}
