import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { CreateInfirmaryVisitDto, InfirmaryListQueryDto } from './dto/operations.dto';
import { getTenantTimezone, zonedDayStart, zonedRange } from './operations.utils';

// Student with the class/section of their current-year enrollment.
const studentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  admissionNumber: true,
  enrollments: {
    where: { academicYear: { isCurrent: true } },
    take: 1,
    select: { rollNumber: true, section: { select: { name: true, class: { select: { name: true } } } } },
  },
} satisfies Prisma.StudentSelect;

type VisitWithStudent = Prisma.InfirmaryVisitGetPayload<{ include: { student: { select: typeof studentSelect } } }>;

@Injectable()
export class InfirmaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: InfirmaryListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = query.search?.trim();
    const timezone = query.from || query.to ? await getTenantTimezone(this.prisma, tenantId) : null;

    let visitedAt: Prisma.DateTimeFilter | undefined;
    if (query.from && query.to) {
      if (query.from > query.to) throw new BadRequestException('"From" date must be on or before the "To" date');
      visitedAt = zonedRange(query.from, query.to, timezone!);
    } else if (query.from) {
      visitedAt = { gte: zonedDayStart(query.from, timezone!) };
    } else if (query.to) {
      visitedAt = { lt: zonedRange(query.to, query.to, timezone!).lt };
    }

    const where: Prisma.InfirmaryVisitWhereInput = {
      tenantId,
      ...(query.studentId && { studentId: query.studentId }),
      ...(visitedAt && { visitedAt }),
      ...(search && {
        OR: [
          { complaint: { contains: search, mode: 'insensitive' } },
          { treatment: { contains: search, mode: 'insensitive' } },
          { student: { firstName: { contains: search, mode: 'insensitive' } } },
          { student: { lastName: { contains: search, mode: 'insensitive' } } },
          { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.infirmaryVisit.findMany({
        where,
        include: { student: { select: studentSelect } },
        orderBy: { visitedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.infirmaryVisit.count({ where }),
    ]);
    return paginated(rows.map((r) => this.toView(r)), total, page, limit);
  }

  async create(user: AuthUser, dto: CreateInfirmaryVisitDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException('Student not found in this school');

    const visitedAt = dto.visitedAt ? new Date(dto.visitedAt) : new Date();
    if (Number.isNaN(visitedAt.getTime())) throw new BadRequestException('Invalid visit time');
    if (visitedAt.getTime() > Date.now() + 5 * 60_000) {
      throw new BadRequestException('Visit time cannot be in the future');
    }

    const visit = await this.prisma.infirmaryVisit.create({
      data: {
        tenantId: user.tenantId,
        studentId: student.id,
        complaint: dto.complaint.trim(),
        treatment: dto.treatment.trim(),
        visitedAt,
      },
      include: { student: { select: studentSelect } },
    });
    await this.audit.log(user, 'CREATE', 'InfirmaryVisit', visit.id, {
      studentId: student.id,
      student: `${student.firstName} ${student.lastName}`.trim(),
      complaint: visit.complaint,
    });
    return this.toView(visit);
  }

  private toView(visit: VisitWithStudent) {
    const { student, ...rest } = visit;
    const enrollment = student.enrollments[0];
    return {
      ...rest,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNumber: student.admissionNumber,
        rollNumber: enrollment?.rollNumber ?? null,
        sectionLabel: enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : null,
      },
    };
  }
}
