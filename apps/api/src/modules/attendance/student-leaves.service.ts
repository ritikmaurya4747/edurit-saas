import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { getPagination, paginated } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { personName, SECTION_SELECT, sectionLabel } from './attendance.helpers';
import { CreateStudentLeaveDto, StudentLeaveListQueryDto, UpdateStudentLeaveStatusDto } from './dto/attendance.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

const LEAVE_INCLUDE = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      enrollments: {
        where: { academicYear: { isCurrent: true, deletedAt: null } },
        select: { rollNumber: true, section: { select: SECTION_SELECT } },
        take: 1,
      },
    },
  },
} satisfies Prisma.StudentLeaveInclude;

type LeaveWithStudent = Prisma.StudentLeaveGetPayload<{ include: typeof LEAVE_INCLUDE }>;

@Injectable()
export class StudentLeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: StudentLeaveListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = query.search?.trim();

    const where: Prisma.StudentLeaveWhereInput = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.studentId && { studentId: query.studentId }),
      student: {
        deletedAt: null,
        ...(query.sectionId && {
          enrollments: { some: { sectionId: query.sectionId, academicYear: { isCurrent: true, deletedAt: null } } },
        }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { admissionNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    };

    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.studentLeave.findMany({
        where,
        include: LEAVE_INCLUDE,
        // Pending first (enum order), then the most recent requests.
        orderBy: [{ status: 'asc' }, { startDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.studentLeave.count({ where }),
    ]);

    return paginated(items.map((l) => this.serialize(l)), totalCount, page, limit);
  }

  async create(user: AuthUser, dto: CreateStudentLeaveDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) throw new BadRequestException('End date must be on or after the start date');
    if (endDate.getTime() - startDate.getTime() > 90 * DAY_MS) {
      throw new BadRequestException('A single leave request cannot be longer than 90 days');
    }

    const overlap = await this.prisma.studentLeave.findFirst({
      where: {
        tenantId: user.tenantId,
        studentId: student.id,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { startDate: true, endDate: true, status: true },
    });
    if (overlap) {
      throw new BadRequestException(
        `${personName(student)} already has a ${overlap.status.toLowerCase()} leave from ${formatDateOnly(
          overlap.startDate,
        )} to ${formatDateOnly(overlap.endDate)}`,
      );
    }

    const leave = await this.prisma.studentLeave.create({
      data: { tenantId: user.tenantId, studentId: student.id, startDate, endDate, reason: dto.reason.trim() },
      include: LEAVE_INCLUDE,
    });
    await this.audit.log(user, 'CREATE', 'StudentLeave', leave.id, {
      student: personName(student),
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return this.serialize(leave);
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateStudentLeaveStatusDto) {
    const leave = await this.prisma.studentLeave.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException(`This leave request was already ${leave.status.toLowerCase()}`);
    }

    const updated = await this.prisma.studentLeave.update({
      where: { id },
      data: { status: dto.status, actionReason: dto.actionReason?.trim() || null },
      include: LEAVE_INCLUDE,
    });
    await this.audit.log(user, dto.status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'StudentLeave', id, {
      actionReason: dto.actionReason,
    });
    return this.serialize(updated);
  }

  private serialize(leave: LeaveWithStudent) {
    const enrollment = leave.student.enrollments[0];
    return {
      id: leave.id,
      studentId: leave.studentId,
      studentName: personName(leave.student),
      admissionNumber: leave.student.admissionNumber,
      rollNumber: enrollment?.rollNumber ?? null,
      sectionId: enrollment?.section.id ?? null,
      sectionLabel: enrollment ? sectionLabel(enrollment.section) : null,
      startDate: formatDateOnly(leave.startDate),
      endDate: formatDateOnly(leave.endDate),
      days: Math.round((leave.endDate.getTime() - leave.startDate.getTime()) / DAY_MS) + 1,
      reason: leave.reason,
      status: leave.status,
      actionReason: leave.actionReason,
      createdAt: leave.createdAt,
    };
  }
}
