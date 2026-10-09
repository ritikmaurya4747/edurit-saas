import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { BranchesService } from './branches.service';
import { CreateClassDto, CreateSectionDto, UpdateClassDto, UpdateSectionDto } from './dto/academic.dto';

const byNaturalName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchesService,
  ) {}

  // Classes with their sections and the student strength of each section in
  // the current academic year. Sorted naturally (Class 2 before Class 10).
  async list(tenantId: string, branchId?: string) {
    const [classes, currentYear] = await Promise.all([
      this.prisma.class.findMany({
        where: { tenantId, deletedAt: null, ...(branchId && { branchId }) },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          sections: { where: { deletedAt: null }, select: { id: true, name: true, capacity: true } },
        },
      }),
      this.prisma.academicYear.findFirst({ where: { tenantId, isCurrent: true, deletedAt: null }, select: { id: true } }),
    ]);

    const strength = new Map<string, number>();
    if (currentYear) {
      const counts = await this.prisma.studentEnrollment.groupBy({
        by: ['sectionId'],
        where: { tenantId, academicYearId: currentYear.id, student: { deletedAt: null, status: 'ACTIVE' } },
        _count: { _all: true },
      });
      counts.forEach((c) => strength.set(c.sectionId, c._count._all));
    }

    return classes.sort(byNaturalName).map((cls) => {
      const sections = cls.sections
        .sort(byNaturalName)
        .map((s) => ({ ...s, studentCount: strength.get(s.id) ?? 0 }));
      return {
        ...cls,
        sections,
        studentCount: sections.reduce((sum, s) => sum + s.studentCount, 0),
      };
    });
  }

  // Flat section list for dropdowns: "Class 8 - B".
  async listSections(tenantId: string) {
    const classes = await this.list(tenantId);
    return classes.flatMap((cls) =>
      cls.sections.map((s) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        studentCount: s.studentCount,
        classId: cls.id,
        className: cls.name,
        label: `${cls.name} - ${s.name}`,
      })),
    );
  }

  async get(tenantId: string, id: string) {
    const classes = await this.list(tenantId);
    const cls = classes.find((c) => c.id === id);
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async create(user: AuthUser, dto: CreateClassDto) {
    const branchId = await this.branches.resolveBranchId(user.tenantId, dto.branchId);
    const sectionNames = [...new Set((dto.sections ?? []).map((s) => s.trim().toUpperCase()).filter(Boolean))];

    const cls = await this.prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: { tenantId: user.tenantId, branchId, name: dto.name.trim(), code: dto.code.trim().toUpperCase() },
      });
      if (sectionNames.length) {
        await tx.section.createMany({
          data: sectionNames.map((name) => ({
            tenantId: user.tenantId,
            classId: created.id,
            name,
            capacity: dto.sectionCapacity ?? 40,
          })),
        });
      }
      return created;
    });
    await this.audit.log(user, 'CREATE', 'Class', cls.id, { name: cls.name, sections: sectionNames });
    return this.get(user.tenantId, cls.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateClassDto) {
    await this.findClassOrThrow(user.tenantId, id);
    await this.prisma.class.update({
      where: { id },
      data: { name: dto.name?.trim(), code: dto.code?.trim().toUpperCase() },
    });
    await this.audit.log(user, 'UPDATE', 'Class', id, { ...dto });
    return this.get(user.tenantId, id);
  }

  async remove(user: AuthUser, id: string) {
    const cls = await this.findClassOrThrow(user.tenantId, id);
    const activeStudents = await this.prisma.studentEnrollment.count({
      where: {
        tenantId: user.tenantId,
        section: { classId: id },
        academicYear: { isCurrent: true },
        student: { deletedAt: null },
      },
    });
    if (activeStudents > 0) {
      throw new BadRequestException(`Class has ${activeStudents} enrolled student(s) this year and cannot be deleted`);
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.section.updateMany({ where: { tenantId: user.tenantId, classId: id }, data: { deletedAt: now } }),
      this.prisma.class.update({
        where: { id },
        data: { deletedAt: now, code: `${cls.code}~${now.getTime().toString(36)}`.slice(0, 32) },
      }),
    ]);
    await this.audit.log(user, 'DELETE', 'Class', id, { name: cls.name });
    return { id, deleted: true };
  }

  async addSection(user: AuthUser, classId: string, dto: CreateSectionDto) {
    await this.findClassOrThrow(user.tenantId, classId);
    const section = await this.prisma.section.create({
      data: {
        tenantId: user.tenantId,
        classId,
        name: dto.name.trim().toUpperCase(),
        capacity: dto.capacity ?? 40,
      },
    });
    await this.audit.log(user, 'CREATE', 'Section', section.id, { classId, name: section.name });
    return section;
  }

  async updateSection(user: AuthUser, id: string, dto: UpdateSectionDto) {
    await this.findSectionOrThrow(user.tenantId, id);
    const section = await this.prisma.section.update({
      where: { id },
      data: { name: dto.name?.trim().toUpperCase(), capacity: dto.capacity },
    });
    await this.audit.log(user, 'UPDATE', 'Section', id, { ...dto });
    return section;
  }

  async removeSection(user: AuthUser, id: string) {
    const section = await this.findSectionOrThrow(user.tenantId, id);
    const enrolled = await this.prisma.studentEnrollment.count({
      where: { tenantId: user.tenantId, sectionId: id, academicYear: { isCurrent: true }, student: { deletedAt: null } },
    });
    if (enrolled > 0) {
      throw new BadRequestException(`Section has ${enrolled} enrolled student(s) this year and cannot be deleted`);
    }
    const now = new Date();
    await this.prisma.section.update({
      where: { id },
      data: { deletedAt: now, name: `${section.name}~${now.getTime().toString(36)}`.slice(0, 64) },
    });
    await this.audit.log(user, 'DELETE', 'Section', id, { name: section.name });
    return { id, deleted: true };
  }

  private async findClassOrThrow(tenantId: string, id: string) {
    const cls = await this.prisma.class.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  private async findSectionOrThrow(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }
}
