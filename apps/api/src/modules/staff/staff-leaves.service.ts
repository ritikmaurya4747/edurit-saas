import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveStatus, Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StaffContextService } from '../../common/services/staff-context.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { CreateStaffLeaveDto, StaffLeaveListQueryDto, UpdateStaffLeaveStatusDto } from './dto/staff.dto';
import { hasPermission, inclusiveDays, staffName } from './staff-hr.utils';

const MAX_LEAVE_DAYS = 366;

const leaveInclude = {
  staff: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      department: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.StaffLeaveInclude;

type LeaveRow = Prisma.StaffLeaveGetPayload<{ include: typeof leaveInclude }>;

@Injectable()
export class StaffLeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staffContext: StaffContextService,
  ) {}

  async list(user: AuthUser, query: StaffLeaveListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const canApprove = hasPermission(user, PERMISSIONS.STAFF_LEAVE_APPROVE);
    // Without approval rights you only ever see your own requests.
    if (!canApprove && !user.staffId) return paginated([], 0, page, limit);
    const staffId = canApprove ? query.staffId : user.staffId!;

    const where: Prisma.StaffLeaveWhereInput = {
      tenantId: user.tenantId,
      staff: { deletedAt: null },
      ...(staffId && { staffId }),
      ...(query.status && { status: query.status }),
      ...(query.from && { endDate: { gte: parseDateOnly(query.from) } }),
      ...(query.to && { startDate: { lte: parseDateOnly(query.to) } }),
    };
    const terms = query.search?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (terms.length) {
      where.AND = terms.map((term) => ({
        OR: [
          { reason: { contains: term, mode: 'insensitive' } },
          { staff: { employeeCode: { contains: term, mode: 'insensitive' } } },
          { staff: { user: { firstName: { contains: term, mode: 'insensitive' } } } },
          { staff: { user: { lastName: { contains: term, mode: 'insensitive' } } } },
        ],
      }));
    }

    const [rows, total] = await Promise.all([
      this.prisma.staffLeave.findMany({
        where,
        skip,
        take,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        include: leaveInclude,
      }),
      this.prisma.staffLeave.count({ where }),
    ]);
    return paginated(
      rows.map((r) => this.toItem(r, user)),
      total,
      page,
      limit,
    );
  }

  async create(user: AuthUser, dto: CreateStaffLeaveDto) {
    const canApprove = hasPermission(user, PERMISSIONS.STAFF_LEAVE_APPROVE);
    const ownStaffId = dto.staffId && canApprove ? null : await this.staffContext.resolveStaffId(user);
    if (dto.staffId && !canApprove && dto.staffId !== ownStaffId) {
      throw new ForbiddenException('You can only apply for leave for yourself');
    }
    const staffId = dto.staffId ?? ownStaffId!;
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) throw new BadRequestException('End date cannot be before the start date');
    if (inclusiveDays(startDate, endDate) > MAX_LEAVE_DAYS) throw new BadRequestException('A single leave request cannot exceed one year');

    const overlap = await this.prisma.staffLeave.findFirst({
      where: {
        tenantId: user.tenantId,
        staffId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { startDate: true, endDate: true, status: true },
    });
    if (overlap) {
      throw new ConflictException(
        `${staffName(staff.user)} already has a ${overlap.status.toLowerCase()} leave from ${formatDateOnly(overlap.startDate)} to ${formatDateOnly(overlap.endDate)}`,
      );
    }

    const leave = await this.prisma.staffLeave.create({
      data: {
        tenantId: user.tenantId,
        staffId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        reason: dto.reason.trim(),
      },
      include: leaveInclude,
    });
    await this.audit.log(user, 'CREATE', 'StaffLeave', leave.id, {
      staffId,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return this.toItem(leave, user);
  }

  async setStatus(user: AuthUser, id: string, dto: UpdateStaffLeaveStatusDto) {
    const leave = await this.findOrThrow(user.tenantId, id);
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`This leave request has already been ${leave.status.toLowerCase()}`);
    }
    if (leave.staff.userId === user.id && !user.isAdmin) {
      throw new ForbiddenException('You cannot approve or reject your own leave request');
    }
    if (dto.status === LeaveStatus.REJECTED && !dto.actionReason?.trim()) {
      throw new BadRequestException('Please give a reason for rejecting the leave');
    }
    if (dto.status === LeaveStatus.APPROVED) {
      const overlap = await this.prisma.staffLeave.count({
        where: {
          tenantId: user.tenantId,
          staffId: leave.staffId,
          id: { not: id },
          status: LeaveStatus.APPROVED,
          startDate: { lte: leave.endDate },
          endDate: { gte: leave.startDate },
        },
      });
      if (overlap) throw new ConflictException('These dates overlap with another approved leave');
    }

    const updated = await this.prisma.staffLeave.update({
      where: { id },
      data: { status: dto.status, actionReason: dto.actionReason?.trim() || null },
      include: leaveInclude,
    });
    await this.audit.log(user, dto.status === LeaveStatus.APPROVED ? 'APPROVE' : 'REJECT', 'StaffLeave', id, {
      actionReason: dto.actionReason,
    });
    return this.toItem(updated, user);
  }

  async cancel(user: AuthUser, id: string) {
    const leave = await this.findOrThrow(user.tenantId, id);
    const own = leave.staff.userId === user.id;
    if (!own && !hasPermission(user, PERMISSIONS.STAFF_LEAVE_APPROVE)) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }
    await this.prisma.staffLeave.delete({ where: { id } });
    await this.audit.log(user, 'CANCEL', 'StaffLeave', id, { staffId: leave.staffId });
    return { id, deleted: true };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const leave = await this.prisma.staffLeave.findFirst({ where: { id, tenantId }, include: leaveInclude });
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }

  private toItem(leave: LeaveRow, user: AuthUser) {
    return {
      id: leave.id,
      staffId: leave.staffId,
      staffName: staffName(leave.staff.user),
      employeeCode: leave.staff.employeeCode,
      designation: leave.staff.designation,
      department: leave.staff.department,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: inclusiveDays(leave.startDate, leave.endDate),
      reason: leave.reason,
      status: leave.status,
      actionReason: leave.actionReason,
      createdAt: leave.createdAt,
      isOwn: leave.staff.userId === user.id,
    };
  }
}
