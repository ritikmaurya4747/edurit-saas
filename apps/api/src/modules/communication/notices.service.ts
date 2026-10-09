import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { CreateNoticeDto, NoticeListQueryDto, NoticeTarget, UpdateNoticeDto } from './dto/notice.dto';

// Which notice audiences a role code can see (in addition to ALL).
const ROLE_AUDIENCES: Record<string, NoticeTarget[]> = {
  ADMIN: ['STAFF'],
  TEACHER: ['STAFF', 'TEACHER'],
  ACCOUNTANT: ['STAFF'],
  STAFF: ['STAFF'],
  STUDENT: ['STUDENT'],
  PARENT: ['PARENT'],
};

type NoticeRow = Prisma.NoticeGetPayload<object>;

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Publishers (and admins) manage every notice; everyone else only reads
  // published notices addressed to everyone or to one of their roles.
  canManage(user: AuthUser) {
    return user.isAdmin || user.permissions.includes(PERMISSIONS.NOTICE_PUBLISH);
  }

  private visibilityWhere(user: AuthUser): Prisma.NoticeWhereInput {
    if (this.canManage(user)) return {};
    const audiences = new Set<NoticeTarget>(['ALL']);
    user.roles.forEach((role) => (ROLE_AUDIENCES[role] ?? []).forEach((a) => audiences.add(a)));
    return { status: 'PUBLISHED', targetRole: { in: [...audiences] } };
  }

  async list(user: AuthUser, query: NoticeListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const search = query.search?.trim();
    const where: Prisma.NoticeWhereInput = {
      AND: [
        { tenantId: user.tenantId, deletedAt: null },
        query.status ? { status: query.status } : {},
        query.priority ? { priority: query.priority } : {},
        query.targetRole ? { targetRole: query.targetRole } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        this.visibilityWhere(user),
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notice.findMany({ where, orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }], skip, take }),
      this.prisma.notice.count({ where }),
    ]);
    return paginated(await this.withAuthors(rows), total, page, limit);
  }

  // Counts per status for the header chips (readers only see their published count).
  async stats(user: AuthUser) {
    const groups = await this.prisma.notice.groupBy({
      by: ['status'],
      where: { AND: [{ tenantId: user.tenantId, deletedAt: null }, this.visibilityWhere(user)] },
      _count: { _all: true },
    });
    const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 } as Record<string, number>;
    groups.forEach((g) => (counts[g.status] = g._count._all));
    return {
      draft: counts.DRAFT ?? 0,
      published: counts.PUBLISHED ?? 0,
      archived: counts.ARCHIVED ?? 0,
      total: groups.reduce((sum, g) => sum + g._count._all, 0),
    };
  }

  async get(user: AuthUser, id: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { AND: [{ id, tenantId: user.tenantId, deletedAt: null }, this.visibilityWhere(user)] },
    });
    if (!notice) throw new NotFoundException('Notice not found');
    const [withAuthor] = await this.withAuthors([notice]);
    return withAuthor;
  }

  async create(user: AuthUser, dto: CreateNoticeDto) {
    const status = dto.status ?? 'PUBLISHED';
    const notice = await this.prisma.notice.create({
      data: {
        tenantId: user.tenantId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        targetRole: dto.targetRole ?? 'ALL',
        priority: dto.priority ?? 'INFO',
        status,
        createdById: user.id,
        publishedAt: new Date(),
      },
    });
    await this.audit.log(user, 'CREATE', 'Notice', notice.id, {
      title: notice.title,
      status,
      targetRole: notice.targetRole,
    });
    return this.get(user, notice.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateNoticeDto) {
    const existing = await this.findOrThrow(user.tenantId, id);
    const publishing = dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    await this.prisma.notice.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        targetRole: dto.targetRole,
        priority: dto.priority,
        status: dto.status,
        ...(publishing && { publishedAt: new Date() }),
      },
    });
    await this.audit.log(user, 'UPDATE', 'Notice', id, { ...dto });
    return this.get(user, id);
  }

  async publish(user: AuthUser, id: string) {
    const existing = await this.findOrThrow(user.tenantId, id);
    if (existing.status === 'PUBLISHED') throw new BadRequestException('Notice is already published');
    await this.prisma.notice.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    await this.audit.log(user, 'PUBLISH', 'Notice', id, { title: existing.title, from: existing.status });
    return this.get(user, id);
  }

  async archive(user: AuthUser, id: string) {
    const existing = await this.findOrThrow(user.tenantId, id);
    if (existing.status === 'ARCHIVED') throw new BadRequestException('Notice is already archived');
    await this.prisma.notice.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.audit.log(user, 'ARCHIVE', 'Notice', id, { title: existing.title, from: existing.status });
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.findOrThrow(user.tenantId, id);
    await this.prisma.notice.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', 'Notice', id, { title: existing.title });
    return { id, deleted: true };
  }

  private async findOrThrow(tenantId: string, id: string) {
    const notice = await this.prisma.notice.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  // Notice.createdById has no relation in the schema, so author names are
  // looked up in one query.
  private async withAuthors(rows: NoticeRow[]) {
    const ids = [...new Set(rows.map((n) => n.createdById).filter((v): v is string => !!v))];
    const users = ids.length
      ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const names = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
    return rows.map((n) => ({
      ...n,
      createdBy: n.createdById && names.has(n.createdById) ? { id: n.createdById, name: names.get(n.createdById)! } : null,
    }));
  }
}
