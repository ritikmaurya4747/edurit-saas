import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { getPagination, paginated } from '../../common/utils/pagination';
import { BookListQueryDto, CreateBookDto, UpdateBookDto } from './dto/library.dto';

const ENTITY = 'LibraryBook';

const normaliseIsbn = (isbn?: string | null) => (isbn ? isbn.replace(/[\s-]/g, '').toUpperCase() : null);
// undefined = keep, null/blank = clear.
const optionalText = (value: string | null | undefined) =>
  value === undefined ? undefined : value === null ? null : value.trim() || null;

const bookInclude = {
  _count: { select: { issues: { where: { returnedAt: null } } } },
} satisfies Prisma.LibraryBookInclude;

type BookWithCount = Prisma.LibraryBookGetPayload<{ include: typeof bookInclude }>;

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: BookListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const words = (query.search ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
    const category = query.category?.trim();
    const where: Prisma.LibraryBookWhereInput = {
      tenantId,
      deletedAt: null,
      ...(category && { category: { equals: category, mode: 'insensitive' } }),
      ...(query.available && { availableCopies: { gt: 0 } }),
      ...(words.length && {
        AND: words.map((word) => ({
          OR: [
            { title: { contains: word, mode: 'insensitive' as const } },
            { author: { contains: word, mode: 'insensitive' as const } },
            { isbn: { contains: word.replace(/-/g, ''), mode: 'insensitive' as const } },
          ],
        })),
      }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.libraryBook.findMany({ where, include: bookInclude, orderBy: [{ title: 'asc' }, { createdAt: 'asc' }], skip, take }),
      this.prisma.libraryBook.count({ where }),
    ]);
    return paginated(rows.map((b) => this.toView(b)), total, page, limit);
  }

  async categories(tenantId: string) {
    const rows = await this.prisma.libraryBook.findMany({
      where: { tenantId, deletedAt: null, category: { not: null } },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category).filter((c): c is string => !!c);
  }

  async get(tenantId: string, id: string) {
    const book = await this.prisma.libraryBook.findFirst({ where: { id, tenantId, deletedAt: null }, include: bookInclude });
    if (!book) throw new NotFoundException('Book not found');
    return this.toView(book);
  }

  async create(user: AuthUser, dto: CreateBookDto) {
    const isbn = normaliseIsbn(dto.isbn);
    if (isbn) await this.assertIsbnFree(user.tenantId, isbn);
    const book = await this.prisma.libraryBook.create({
      data: {
        tenantId: user.tenantId,
        title: dto.title.trim(),
        author: dto.author?.trim() || null,
        isbn,
        publisher: dto.publisher?.trim() || null,
        category: dto.category?.trim() || null,
        shelfLocation: dto.shelfLocation?.trim().toUpperCase() || null,
        totalCopies: dto.totalCopies,
        availableCopies: dto.totalCopies,
      },
      include: bookInclude,
    });
    await this.audit.log(user, 'CREATE', ENTITY, book.id, { title: book.title, isbn, totalCopies: book.totalCopies });
    return this.toView(book);
  }

  // Changing totalCopies moves availableCopies by the same delta; the total
  // can never drop below the copies currently out with borrowers.
  async update(user: AuthUser, id: string, dto: UpdateBookDto) {
    const book = await this.findOrThrow(user.tenantId, id);
    const isbn = dto.isbn === undefined ? undefined : normaliseIsbn(dto.isbn);
    if (isbn && isbn !== book.isbn) await this.assertIsbnFree(user.tenantId, isbn, id);

    const data: Prisma.LibraryBookUpdateManyMutationInput = {
      title: dto.title?.trim() || undefined,
      author: optionalText(dto.author),
      isbn,
      publisher: optionalText(dto.publisher),
      category: optionalText(dto.category),
      shelfLocation: dto.shelfLocation === undefined ? undefined : dto.shelfLocation?.trim().toUpperCase() || null,
    };

    await this.prisma.$transaction(async (tx) => {
      const delta = dto.totalCopies !== undefined && dto.totalCopies !== null ? dto.totalCopies - book.totalCopies : 0;
      if (delta !== 0) {
        const issued = await tx.bookIssue.count({ where: { tenantId: user.tenantId, bookId: id, returnedAt: null } });
        if (dto.totalCopies < issued) {
          throw new BadRequestException(
            `${issued} cop${issued === 1 ? 'y is' : 'ies are'} currently issued — total copies cannot be less than ${issued}`,
          );
        }
        data.totalCopies = dto.totalCopies;
        data.availableCopies = { increment: delta };
      }
      // Conditional update guards against a concurrent issue/return changing the counts.
      const result = await tx.libraryBook.updateMany({
        where: {
          id,
          tenantId: user.tenantId,
          deletedAt: null,
          totalCopies: book.totalCopies,
          ...(delta < 0 && { availableCopies: { gte: -delta } }),
        },
        data,
      });
      if (result.count === 0) {
        throw new BadRequestException('The copy count changed while you were editing (a book was issued or returned). Please retry.');
      }
      await this.audit.log(user, 'UPDATE', ENTITY, id, { ...dto, ...(isbn !== undefined && { isbn }) }, tx);
    });
    return this.get(user.tenantId, id);
  }

  async remove(user: AuthUser, id: string) {
    const book = await this.findOrThrow(user.tenantId, id);
    const issued = await this.prisma.bookIssue.count({ where: { tenantId: user.tenantId, bookId: id, returnedAt: null } });
    if (issued > 0) {
      throw new BadRequestException(
        `${issued} cop${issued === 1 ? 'y of this book is' : 'ies of this book are'} still issued. Collect them before deleting the title.`,
      );
    }
    await this.prisma.libraryBook.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(user, 'DELETE', ENTITY, id, { title: book.title, isbn: book.isbn });
    return { id, deleted: true };
  }

  private async assertIsbnFree(tenantId: string, isbn: string, exceptId?: string) {
    const clash = await this.prisma.libraryBook.findFirst({
      where: { tenantId, deletedAt: null, isbn, ...(exceptId && { id: { not: exceptId } }) },
      select: { title: true },
    });
    if (clash) {
      throw new ConflictException(`ISBN ${isbn} is already in the catalogue as "${clash.title}". Add copies to that title instead.`);
    }
  }

  private async findOrThrow(tenantId: string, id: string) {
    const book = await this.prisma.libraryBook.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  private toView(book: BookWithCount) {
    const { _count, deletedAt, tenantId, ...rest } = book;
    return { ...rest, issuedCount: _count.issues };
  }
}
