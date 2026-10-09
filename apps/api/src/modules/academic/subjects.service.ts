import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/academic.dto';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(user: AuthUser, dto: CreateSubjectDto) {
    const subject = await this.prisma.subject.create({
      data: { tenantId: user.tenantId, name: dto.name.trim(), code: dto.code.trim().toUpperCase() },
    });
    await this.audit.log(user, 'CREATE', 'Subject', subject.id, { name: subject.name, code: subject.code });
    return subject;
  }

  async update(user: AuthUser, id: string, dto: UpdateSubjectDto) {
    await this.findOrThrow(user.tenantId, id);
    const subject = await this.prisma.subject.update({
      where: { id },
      data: { name: dto.name?.trim(), code: dto.code?.trim().toUpperCase() },
    });
    await this.audit.log(user, 'UPDATE', 'Subject', id, { ...dto });
    return subject;
  }

  // Soft delete keeps historical marks/homework intact. The code is suffixed
  // so it can be reused by a new subject (code is unique per tenant).
  async remove(user: AuthUser, id: string) {
    const subject = await this.findOrThrow(user.tenantId, id);
    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date(), code: `${subject.code}~${Date.now().toString(36)}`.slice(0, 32) },
    });
    await this.audit.log(user, 'DELETE', 'Subject', id, { name: subject.name });
    return { id, deleted: true };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }
}
