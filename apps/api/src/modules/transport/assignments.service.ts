import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { toNumber } from '../../common/utils/money';
import { getPagination, paginated } from '../../common/utils/pagination';
import { AssignmentListQueryDto, CreateAssignmentDto, EndAssignmentDto } from './dto/transport.dto';
import { schoolToday, studentSearchWhere, studentView, transportStudentSelect } from './transport.utils';

const ENTITY = 'StudentTransport';

const assignmentInclude = {
  student: { select: transportStudentSelect },
  route: {
    select: {
      id: true,
      name: true,
      code: true,
      monthlyFee: true,
      isActive: true,
      deletedAt: true,
      vehicle: { select: { id: true, registrationNumber: true, driverName: true, driverPhone: true } },
    },
  },
  stop: { select: { id: true, name: true, sequence: true, pickupTime: true, dropTime: true, fee: true } },
} satisfies Prisma.StudentTransportInclude;

type AssignmentWithDetails = Prisma.StudentTransportGetPayload<{ include: typeof assignmentInclude }>;

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: AssignmentListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = studentSearchWhere(query.search);
    const studentWhere: Prisma.StudentWhereInput = {
      deletedAt: null,
      ...(query.sectionId && {
        enrollments: { some: { sectionId: query.sectionId, academicYear: { isCurrent: true, deletedAt: null } } },
      }),
      ...search,
    };
    const where: Prisma.StudentTransportWhereInput = {
      tenantId,
      ...(!query.includeInactive && { isActive: true }),
      ...(query.routeId && { routeId: query.routeId }),
      route: { deletedAt: null },
      student: studentWhere,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.studentTransport.findMany({
        where,
        include: assignmentInclude,
        orderBy: [{ isActive: 'desc' }, { route: { code: 'asc' } }, { student: { firstName: 'asc' } }, { startDate: 'desc' }],
        skip,
        take,
      }),
      this.prisma.studentTransport.count({ where }),
    ]);
    return paginated(rows.map((r) => this.toView(r)), total, page, limit);
  }

  // One active assignment per student: assigning again moves the student
  // (the previous assignment is closed today) in the same transaction.
  async assign(user: AuthUser, dto: CreateAssignmentDto) {
    const tenantId = user.tenantId;
    const [student, route, today] = await Promise.all([
      this.prisma.student.findFirst({
        where: { id: dto.studentId, tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, status: true },
      }),
      this.prisma.transportRoute.findFirst({
        where: { id: dto.routeId, tenantId, deletedAt: null },
        include: { vehicle: { select: { registrationNumber: true, capacity: true } } },
      }),
      schoolToday(this.prisma, tenantId),
    ]);
    if (!student) throw new NotFoundException('Student not found in this school');
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    if (student.status !== 'ACTIVE') throw new BadRequestException(`${studentName} is not an active student`);
    if (!route) throw new NotFoundException('Route not found');
    if (!route.isActive) throw new BadRequestException(`Route ${route.code} is inactive`);

    if (dto.stopId) {
      const stop = await this.prisma.routeStop.findFirst({
        where: { id: dto.stopId, routeId: route.id, route: { tenantId } },
        select: { id: true },
      });
      if (!stop) throw new BadRequestException('The selected stop is not on this route');
    }
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : today;

    const assignment = await this.prisma.$transaction(async (tx) => {
      const current = await tx.studentTransport.findMany({
        where: { tenantId, studentId: student.id, isActive: true },
        select: { id: true, routeId: true, stopId: true, startDate: true },
      });
      if (current.some((c) => c.routeId === route.id && (c.stopId ?? null) === (dto.stopId ?? null))) {
        throw new BadRequestException(`${studentName} is already assigned to this route and stop`);
      }

      if (route.vehicle) {
        const riding = await tx.studentTransport.count({
          where: { tenantId, routeId: route.id, isActive: true, studentId: { not: student.id } },
        });
        if (riding >= route.vehicle.capacity) {
          throw new BadRequestException(
            `Route ${route.code} is full: vehicle ${route.vehicle.registrationNumber} has ${route.vehicle.capacity} seats ` +
              `and ${riding} students are assigned. Use a bigger vehicle or another route.`,
          );
        }
      }

      for (const previous of current) {
        const endDate = previous.startDate > today ? previous.startDate : today;
        await tx.studentTransport.update({ where: { id: previous.id }, data: { isActive: false, endDate } });
      }

      const created = await tx.studentTransport.create({
        data: { tenantId, studentId: student.id, routeId: route.id, stopId: dto.stopId ?? null, startDate },
        include: assignmentInclude,
      });
      await this.audit.log(
        user,
        current.length ? 'REASSIGN' : 'CREATE',
        ENTITY,
        created.id,
        {
          studentId: student.id,
          student: studentName,
          route: route.code,
          stopId: dto.stopId ?? null,
          startDate: formatDateOnly(startDate),
          endedAssignments: current.map((c) => c.id),
        },
        tx,
      );
      return created;
    });
    return this.toView(assignment);
  }

  async end(user: AuthUser, id: string, dto: EndAssignmentDto) {
    const assignment = await this.prisma.studentTransport.findFirst({
      where: { id, tenantId: user.tenantId },
      include: assignmentInclude,
    });
    if (!assignment) throw new NotFoundException('Transport assignment not found');
    if (!assignment.isActive) throw new BadRequestException('This assignment has already ended');

    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : await schoolToday(this.prisma, user.tenantId);
    if (endDate < assignment.startDate) {
      throw new BadRequestException(`End date cannot be before the start date (${formatDateOnly(assignment.startDate)})`);
    }

    const updated = await this.prisma.studentTransport.update({
      where: { id },
      data: { isActive: false, endDate },
      include: assignmentInclude,
    });
    await this.audit.log(user, 'END', ENTITY, id, {
      studentId: assignment.studentId,
      route: assignment.route.code,
      endDate: formatDateOnly(endDate),
    });
    return this.toView(updated);
  }

  // Current assignment plus full history for one student.
  async forStudent(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      select: transportStudentSelect,
    });
    if (!student) throw new NotFoundException('Student not found in this school');
    const rows = await this.prisma.studentTransport.findMany({
      where: { tenantId, studentId },
      include: assignmentInclude,
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }, { createdAt: 'desc' }],
    });
    const views = rows.map((r) => this.toView(r));
    return {
      student: studentView(student),
      current: views.find((v) => v.isActive) ?? null,
      history: views,
    };
  }

  private toView(assignment: AssignmentWithDetails) {
    const { student, route, stop, ...rest } = assignment;
    const { deletedAt, ...routeView } = route;
    const monthlyFee = stop?.fee != null ? toNumber(stop.fee) : toNumber(route.monthlyFee);
    return {
      ...rest,
      student: studentView(student),
      route: { ...routeView, isDeleted: !!deletedAt },
      stop,
      // Fee per month for this student (stop fee overrides the route fee).
      monthlyFee,
    };
  }
}
