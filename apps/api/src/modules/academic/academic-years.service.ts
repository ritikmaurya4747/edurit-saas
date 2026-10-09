import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { parseDateOnly } from '../../common/utils/date';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.academicYear.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { enrollments: true, exams: true } } },
    });
  }

  async current(tenantId: string) {
    return this.prisma.academicYear.findFirst({
      where: { tenantId, deletedAt: null, isCurrent: true },
    });
  }

  // Used by other modules: the current year, or a clear error if none is set.
  async requireCurrent(tenantId: string) {
    const year = await this.current(tenantId);
    if (!year) throw new BadRequestException('No current academic year is set. Configure one in Academic Setup.');
    return year;
  }

  async create(user: AuthUser, dto: CreateAcademicYearDto) {
    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    const year = await this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({ where: { tenantId: user.tenantId }, data: { isCurrent: false } });
      }
      return tx.academicYear.create({
        data: { tenantId: user.tenantId, name: dto.name.trim(), startDate, endDate, isCurrent: !!dto.isCurrent },
      });
    });
    await this.audit.log(user, 'CREATE', 'AcademicYear', year.id, { name: year.name });
    return year;
  }

  async update(user: AuthUser, id: string, dto: UpdateAcademicYearDto) {
    const existing = await this.findOrThrow(user.tenantId, id);
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : existing.endDate;
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    const year = await this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({ where: { tenantId: user.tenantId }, data: { isCurrent: false } });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          startDate,
          endDate,
          ...(dto.isCurrent !== undefined && { isCurrent: dto.isCurrent }),
        },
      });
    });
    await this.audit.log(user, 'UPDATE', 'AcademicYear', id, { ...dto });
    return year;
  }

  async setCurrent(user: AuthUser, id: string) {
    await this.findOrThrow(user.tenantId, id);
    const [, year] = await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({ where: { tenantId: user.tenantId }, data: { isCurrent: false } }),
      this.prisma.academicYear.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    await this.audit.log(user, 'SET_CURRENT', 'AcademicYear', id, { name: year.name });
    return year;
  }

  async remove(user: AuthUser, id: string) {
    const year = await this.findOrThrow(user.tenantId, id);
    if (year.isCurrent) throw new BadRequestException('The current academic year cannot be deleted');
    const enrollments = await this.prisma.studentEnrollment.count({ where: { tenantId: user.tenantId, academicYearId: id } });
    if (enrollments > 0) {
      throw new BadRequestException(`This year has ${enrollments} student enrollment(s) and cannot be deleted`);
    }
    await this.prisma.academicYear.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'AcademicYear', id, { name: year.name });
    return { id, deleted: true };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }
}
