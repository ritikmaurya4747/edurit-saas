import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { addDays, formatDateOnly, parseDateOnly } from '../../common/utils/date';
import { decimal, round2, toNumber } from '../../common/utils/money';
import { getPagination, paginated } from '../../common/utils/pagination';
import { BorrowerType, CreateIssueDto, IssueListQueryDto, RenewIssueDto, ReturnIssueDto } from './dto/library.dto';
import {
  DEFAULT_LOAN_DAYS,
  FINE_PER_DAY,
  MAX_BOOKS_PER_STUDENT,
  MAX_RENEW_OVERDUE_DAYS,
  dateInZone,
  daysLate,
  fineFor,
  schoolTimezone,
} from './library.utils';

const ENTITY = 'BookIssue';

const issueInclude = {
  book: { select: { id: true, title: true, author: true, isbn: true, shelfLocation: true } },
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      enrollments: {
        where: { academicYear: { isCurrent: true, deletedAt: null } },
        take: 1,
        select: { rollNumber: true, section: { select: { name: true, class: { select: { name: true } } } } },
      },
    },
  },
  staff: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      department: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.BookIssueInclude;

type IssueWithDetails = Prisma.BookIssueGetPayload<{ include: typeof issueInclude }>;

// Every word must match the book title or the borrower's name / number.
function issueSearchWhere(search?: string): Prisma.BookIssueWhereInput | undefined {
  const words = (search ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (!words.length) return undefined;
  const ci = (value: string) => ({ contains: value, mode: 'insensitive' as const });
  return {
    AND: words.map((word) => ({
      OR: [
        { book: { title: ci(word) } },
        { student: { firstName: ci(word) } },
        { student: { lastName: ci(word) } },
        { student: { admissionNumber: ci(word) } },
        { staff: { employeeCode: ci(word) } },
        { staff: { user: { firstName: ci(word) } } },
        { staff: { user: { lastName: ci(word) } } },
      ],
    })),
  };
}

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: IssueListQueryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const today = await this.today(tenantId);
    const where: Prisma.BookIssueWhereInput = {
      tenantId,
      ...(query.status === 'issued' && { returnedAt: null }),
      ...(query.status === 'overdue' && { returnedAt: null, dueDate: { lt: today } }),
      ...(query.status === 'returned' && { returnedAt: { not: null } }),
      ...(query.borrowerType === 'student' && { studentId: { not: null } }),
      ...(query.borrowerType === 'staff' && { staffId: { not: null } }),
      ...(query.bookId && { bookId: query.bookId }),
      ...issueSearchWhere(query.search),
    };
    const orderBy: Prisma.BookIssueOrderByWithRelationInput[] =
      query.status === 'returned'
        ? [{ returnedAt: 'desc' }]
        : query.status
          ? [{ dueDate: 'asc' }, { issuedAt: 'asc' }]
          : [{ issuedAt: 'desc' }];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.bookIssue.findMany({ where, include: issueInclude, orderBy, skip, take }),
      this.prisma.bookIssue.count({ where }),
    ]);
    const timezone = await schoolTimezone(this.prisma, tenantId);
    return paginated(rows.map((r) => this.toView(r, today, timezone)), total, page, limit);
  }

  async issue(user: AuthUser, dto: CreateIssueDto) {
    const tenantId = user.tenantId;
    if (!!dto.studentId === !!dto.staffId) {
      throw new BadRequestException('Choose either a student or a staff member as the borrower');
    }
    const timezone = await schoolTimezone(this.prisma, tenantId);
    const today = dateInZone(new Date(), timezone);
    const dueDate = dto.dueDate ? parseDateOnly(dto.dueDate) : addDays(today, DEFAULT_LOAN_DAYS);
    if (dueDate < today) throw new BadRequestException('Due date cannot be in the past');

    const book = await this.prisma.libraryBook.findFirst({
      where: { id: dto.bookId, tenantId, deletedAt: null },
      select: { id: true, title: true },
    });
    if (!book) throw new NotFoundException('Book not found');

    let borrowerName: string;
    if (dto.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: dto.studentId, tenantId, deletedAt: null },
        select: { firstName: true, lastName: true, status: true },
      });
      if (!student) throw new NotFoundException('Student not found in this school');
      borrowerName = `${student.firstName} ${student.lastName}`.trim();
      if (student.status !== 'ACTIVE') throw new BadRequestException(`${borrowerName} is not an active student`);
    } else {
      const staff = await this.prisma.staff.findFirst({
        where: { id: dto.staffId, tenantId, deletedAt: null },
        select: { status: true, user: { select: { firstName: true, lastName: true } } },
      });
      if (!staff) throw new NotFoundException('Staff member not found in this school');
      borrowerName = `${staff.user.firstName} ${staff.user.lastName}`.trim();
      if (staff.status === 'RESIGNED' || staff.status === 'TERMINATED') {
        throw new BadRequestException(`${borrowerName} is no longer working at the school`);
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const borrowerWhere = dto.studentId ? { studentId: dto.studentId } : { staffId: dto.staffId };
      const holding = await tx.bookIssue.findMany({
        where: { tenantId, returnedAt: null, ...borrowerWhere },
        select: { bookId: true },
      });
      if (holding.some((h) => h.bookId === book.id)) {
        throw new BadRequestException(`${borrowerName} already has a copy of "${book.title}"`);
      }
      if (dto.studentId && holding.length >= MAX_BOOKS_PER_STUDENT) {
        throw new BadRequestException(
          `${borrowerName} already holds ${holding.length} book(s). A student may borrow at most ${MAX_BOOKS_PER_STUDENT} at a time.`,
        );
      }

      // Atomic: only decrements while a copy is on the shelf.
      const taken = await tx.libraryBook.updateMany({
        where: { id: book.id, tenantId, deletedAt: null, availableCopies: { gt: 0 } },
        data: { availableCopies: { decrement: 1 } },
      });
      if (taken.count === 0) throw new BadRequestException(`No copies of "${book.title}" are available`);

      const issue = await tx.bookIssue.create({
        data: {
          tenantId,
          bookId: book.id,
          studentId: dto.studentId ?? null,
          staffId: dto.staffId ?? null,
          dueDate,
          remarks: dto.remarks?.trim() || null,
          issuedById: user.id,
        },
        include: issueInclude,
      });
      await this.audit.log(
        user,
        'ISSUE',
        ENTITY,
        issue.id,
        { book: book.title, borrower: borrowerName, dueDate: formatDateOnly(dueDate) },
        tx,
      );
      return issue;
    });
    return this.toView(created, today, timezone);
  }

  async returnBook(user: AuthUser, id: string, dto: ReturnIssueDto) {
    const issue = await this.findOrThrow(user.tenantId, id);
    if (issue.returnedAt) throw new BadRequestException('This book has already been returned');

    const timezone = await schoolTimezone(this.prisma, user.tenantId);
    const returnedAt = dto.returnedAt ? new Date(dto.returnedAt) : new Date();
    if (Number.isNaN(returnedAt.getTime())) throw new BadRequestException('Invalid return time');
    if (returnedAt.getTime() > Date.now() + 5 * 60_000) throw new BadRequestException('Return time cannot be in the future');
    if (returnedAt < issue.issuedAt) throw new BadRequestException('Return time cannot be before the issue time');

    const lateDays = daysLate(issue.dueDate, dateInZone(returnedAt, timezone));
    const fineAmount = round2(dto.fineAmount ?? fineFor(lateDays));

    const updated = await this.prisma.$transaction(async (tx) => {
      // Conditional update so a double submit cannot return (and restock) twice.
      const result = await tx.bookIssue.updateMany({
        where: { id, tenantId: user.tenantId, returnedAt: null },
        data: {
          returnedAt,
          fineAmount: decimal(fineAmount),
          finePaid: fineAmount > 0 ? (dto.finePaid ?? false) : false,
          ...(dto.remarks !== undefined && { remarks: dto.remarks?.trim() || null }),
        },
      });
      if (result.count === 0) throw new BadRequestException('This book has already been returned');
      await tx.libraryBook.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } });
      await this.audit.log(
        user,
        'RETURN',
        ENTITY,
        id,
        { book: issue.book.title, lateDays, fineAmount, finePaid: dto.finePaid ?? false },
        tx,
      );
      return tx.bookIssue.findUniqueOrThrow({ where: { id }, include: issueInclude });
    });
    return this.toView(updated, dateInZone(new Date(), timezone), timezone);
  }

  async renew(user: AuthUser, id: string, dto: RenewIssueDto) {
    const issue = await this.findOrThrow(user.tenantId, id);
    if (issue.returnedAt) throw new BadRequestException('Returned books cannot be renewed');
    const timezone = await schoolTimezone(this.prisma, user.tenantId);
    const today = dateInZone(new Date(), timezone);
    const overdueDays = daysLate(issue.dueDate, today);
    if (overdueDays > MAX_RENEW_OVERDUE_DAYS) {
      throw new BadRequestException(
        `This book is ${overdueDays} days overdue. Books more than ${MAX_RENEW_OVERDUE_DAYS} days late must be returned (and the fine settled) instead of renewed.`,
      );
    }
    const dueDate = parseDateOnly(dto.dueDate);
    if (dueDate <= today) throw new BadRequestException('The new due date must be after today');
    if (dueDate <= issue.dueDate) {
      throw new BadRequestException(`The new due date must be after the current one (${formatDateOnly(issue.dueDate)})`);
    }
    const updated = await this.prisma.bookIssue.update({ where: { id }, data: { dueDate }, include: issueInclude });
    await this.audit.log(user, 'RENEW', ENTITY, id, {
      book: issue.book.title,
      from: formatDateOnly(issue.dueDate),
      to: formatDateOnly(dueDate),
      overdueDays,
    });
    return this.toView(updated, today, timezone);
  }

  async markFinePaid(user: AuthUser, id: string) {
    const issue = await this.findOrThrow(user.tenantId, id);
    if (!issue.returnedAt) {
      throw new BadRequestException('The fine is settled when the book is returned — use "Return" to record it');
    }
    if (toNumber(issue.fineAmount) <= 0) throw new BadRequestException('There is no fine on this issue');
    if (issue.finePaid) throw new BadRequestException('The fine has already been paid');
    const updated = await this.prisma.bookIssue.update({ where: { id }, data: { finePaid: true }, include: issueInclude });
    await this.audit.log(user, 'FINE_PAID', ENTITY, id, { book: issue.book.title, fineAmount: toNumber(issue.fineAmount) });
    const timezone = await schoolTimezone(this.prisma, user.tenantId);
    return this.toView(updated, dateInZone(new Date(), timezone), timezone);
  }

  // A borrower's full lending history with outstanding counts.
  async borrowerHistory(tenantId: string, type: BorrowerType, id: string) {
    let borrower: { type: BorrowerType; id: string; name: string; classLabel?: string | null; designation?: string | null };
    if (type === 'student') {
      const student = await this.prisma.student.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: issueInclude.student.select,
      });
      if (!student) throw new NotFoundException('Student not found in this school');
      borrower = this.studentBorrower(student);
    } else {
      const staff = await this.prisma.staff.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: issueInclude.staff.select,
      });
      if (!staff) throw new NotFoundException('Staff member not found in this school');
      borrower = this.staffBorrower(staff);
    }

    const timezone = await schoolTimezone(this.prisma, tenantId);
    const today = dateInZone(new Date(), timezone);
    const rows = await this.prisma.bookIssue.findMany({
      where: { tenantId, ...(type === 'student' ? { studentId: id } : { staffId: id }) },
      include: issueInclude,
      orderBy: { issuedAt: 'desc' },
    });
    const issues = rows.map((r) => this.toView(r, today, timezone));
    const current = issues.filter((i) => !i.returnedAt);
    return {
      borrower,
      holding: current.length,
      overdue: current.filter((i) => i.isOverdue).length,
      limit: type === 'student' ? MAX_BOOKS_PER_STUDENT : null,
      finesPending: round2(issues.filter((i) => !i.finePaid).reduce((sum, i) => sum + i.fine, 0)),
      issues,
    };
  }

  async summary(tenantId: string) {
    const today = await this.today(tenantId);
    const [books, issued, overdueIssues, unpaid] = await Promise.all([
      this.prisma.libraryBook.aggregate({
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
        _sum: { totalCopies: true, availableCopies: true },
      }),
      this.prisma.bookIssue.count({ where: { tenantId, returnedAt: null } }),
      this.prisma.bookIssue.findMany({
        where: { tenantId, returnedAt: null, dueDate: { lt: today } },
        select: { dueDate: true },
      }),
      this.prisma.bookIssue.aggregate({
        where: { tenantId, returnedAt: { not: null }, finePaid: false, fineAmount: { gt: 0 } },
        _sum: { fineAmount: true },
      }),
    ]);
    const runningFines = overdueIssues.reduce((sum, i) => sum + fineFor(daysLate(i.dueDate, today)), 0);
    return {
      titles: books._count._all,
      totalCopies: books._sum.totalCopies ?? 0,
      availableCopies: books._sum.availableCopies ?? 0,
      issued,
      overdue: overdueIssues.length,
      finesPending: round2(toNumber(unpaid._sum.fineAmount) + runningFines),
      finePerDay: FINE_PER_DAY,
      maxBooksPerStudent: MAX_BOOKS_PER_STUDENT,
      defaultLoanDays: DEFAULT_LOAN_DAYS,
    };
  }

  private async today(tenantId: string) {
    return dateInZone(new Date(), await schoolTimezone(this.prisma, tenantId));
  }

  private async findOrThrow(tenantId: string, id: string) {
    const issue = await this.prisma.bookIssue.findFirst({ where: { id, tenantId }, include: issueInclude });
    if (!issue) throw new NotFoundException('Issue record not found');
    return issue;
  }

  private studentBorrower(student: NonNullable<IssueWithDetails['student']>) {
    const enrollment = student.enrollments[0];
    return {
      type: 'student' as BorrowerType,
      id: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      number: student.admissionNumber,
      classLabel: enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : null,
      designation: null,
    };
  }

  private staffBorrower(staff: NonNullable<IssueWithDetails['staff']>) {
    return {
      type: 'staff' as BorrowerType,
      id: staff.id,
      name: `${staff.user.firstName} ${staff.user.lastName}`.trim(),
      number: staff.employeeCode,
      classLabel: null,
      designation: staff.designation ?? staff.department ?? null,
    };
  }

  // isOverdue / daysOverdue / fine are computed against the school's today;
  // for returned books the stored fine is used and lateness is as of return.
  private toView(issue: IssueWithDetails, today: Date, timezone: string) {
    const { student, staff, book, ...rest } = issue;
    const returned = !!issue.returnedAt;
    const lateDays = daysLate(issue.dueDate, returned ? dateInZone(issue.returnedAt, timezone) : today);
    const fine = returned ? toNumber(issue.fineAmount) : fineFor(lateDays);
    return {
      ...rest,
      book,
      borrower: student ? this.studentBorrower(student) : staff ? this.staffBorrower(staff) : null,
      status: returned ? 'returned' : lateDays > 0 ? 'overdue' : 'issued',
      isOverdue: !returned && lateDays > 0,
      daysOverdue: lateDays,
      fine,
      finePending: fine > 0 && !issue.finePaid,
    };
  }
}
