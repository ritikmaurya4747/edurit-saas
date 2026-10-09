import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { decimal, toNumber } from '../../common/utils/money';
import { AppraisalListQueryDto, CreateAppraisalDto, UpdateAppraisalDto } from './dto/staff.dto';
import { EMPLOYED_STATUSES, staffName } from './staff-hr.utils';

const appraisalInclude = {
  staff: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      department: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.StaffAppraisalInclude;

type AppraisalRow = Prisma.StaffAppraisalGetPayload<{ include: typeof appraisalInclude }>;

@Injectable()
export class StaffAppraisalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: AppraisalListQueryDto) {
    const rows = await this.prisma.staffAppraisal.findMany({
      where: {
        tenantId,
        staff: { deletedAt: null },
        ...(query.period && { period: query.period.trim() }),
        ...(query.status && { status: query.status }),
      },
      include: appraisalInclude,
      orderBy: [{ period: 'desc' }, { staff: { user: { firstName: 'asc' } } }, { staff: { user: { lastName: 'asc' } } }],
    });
    return rows.map((r) => this.toItem(r));
  }

  // Distinct periods that already have appraisals (for the period filter).
  async periods(tenantId: string) {
    const rows = await this.prisma.staffAppraisal.findMany({
      where: { tenantId },
      distinct: ['period'],
      select: { period: true },
      orderBy: { period: 'desc' },
    });
    return rows.map((r) => r.period);
  }

  // With staffId: one appraisal. Without: start the cycle for every employed staff member.
  async create(user: AuthUser, dto: CreateAppraisalDto) {
    const period = dto.period.trim();
    if (dto.staffId) {
      const staff = await this.prisma.staff.findFirst({
        where: { id: dto.staffId, tenantId: user.tenantId, deletedAt: null },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      });
      if (!staff) throw new NotFoundException('Staff member not found');
      const exists = await this.prisma.staffAppraisal.findUnique({
        where: { tenantId_staffId_period: { tenantId: user.tenantId, staffId: staff.id, period } },
        select: { id: true },
      });
      if (exists) throw new ConflictException(`${staffName(staff.user)} already has an appraisal for ${period}`);
      const created = await this.prisma.staffAppraisal.create({ data: { tenantId: user.tenantId, staffId: staff.id, period } });
      await this.audit.log(user, 'CREATE', 'StaffAppraisal', created.id, { staffId: staff.id, period });
      return { period, created: 1, skipped: 0 };
    }

    const staff = await this.prisma.staff.findMany({
      where: { tenantId: user.tenantId, deletedAt: null, status: { in: EMPLOYED_STATUSES } },
      select: { id: true, appraisals: { where: { period }, select: { id: true } } },
    });
    const missing = staff.filter((s) => s.appraisals.length === 0);
    if (!missing.length) return { period, created: 0, skipped: staff.length };
    const result = await this.prisma.staffAppraisal.createMany({
      data: missing.map((s) => ({ tenantId: user.tenantId, staffId: s.id, period })),
      skipDuplicates: true,
    });
    await this.audit.log(user, 'START_CYCLE', 'StaffAppraisal', null, { period, created: result.count });
    return { period, created: result.count, skipped: staff.length - result.count };
  }

  async update(user: AuthUser, id: string, dto: UpdateAppraisalDto) {
    const appraisal = await this.prisma.staffAppraisal.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!appraisal) throw new NotFoundException('Appraisal not found');

    const status = dto.status ?? appraisal.status;
    const rating = dto.rating ?? (appraisal.rating == null ? null : toNumber(appraisal.rating));
    if (status === 'COMPLETED' && rating == null) throw new BadRequestException('Give a rating before completing the appraisal');

    const updated = await this.prisma.staffAppraisal.update({
      where: { id },
      data: {
        rating: dto.rating !== undefined ? decimal(dto.rating) : undefined,
        remarks: dto.remarks !== undefined ? dto.remarks.trim() || null : undefined,
        status,
        reviewedAt: status === 'COMPLETED' ? (appraisal.status === 'COMPLETED' ? appraisal.reviewedAt ?? new Date() : new Date()) : null,
      },
      include: appraisalInclude,
    });
    await this.audit.log(user, 'UPDATE', 'StaffAppraisal', id, { ...dto });
    return this.toItem(updated);
  }

  private toItem(a: AppraisalRow) {
    return {
      id: a.id,
      staffId: a.staffId,
      staffName: staffName(a.staff.user),
      employeeCode: a.staff.employeeCode,
      designation: a.staff.designation,
      department: a.staff.department,
      period: a.period,
      rating: a.rating,
      remarks: a.remarks,
      status: a.status,
      reviewedAt: a.reviewedAt,
      createdAt: a.createdAt,
    };
  }
}
