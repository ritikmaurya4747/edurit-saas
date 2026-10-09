import { Body, Controller, Delete, Get, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { BooksService } from './books.service';
import { IssuesService } from './issues.service';
import {
  BookListQueryDto,
  type BorrowerType,
  CreateBookDto,
  CreateIssueDto,
  IssueListQueryDto,
  RenewIssueDto,
  ReturnIssueDto,
  UpdateBookDto,
} from './dto/library.dto';

const BorrowerTypeEnum = { student: 'student', staff: 'staff' } as const;

@ApiTags('Library')
@TenantAuth(PERMISSIONS.LIBRARY_READ)
@Controller({ path: 'library', version: '1' })
export class LibraryController {
  constructor(
    private readonly books: BooksService,
    private readonly issues: IssuesService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Library tiles: titles, copies, issued, overdue and pending fines' })
  summary(@CurrentUser('tenantId') tenantId: string) {
    return this.issues.summary(tenantId);
  }

  // ---------- Books ----------
  @Get('books')
  @ApiOperation({ summary: 'Catalogue (search title/author/ISBN, category, available only) with issued counts' })
  listBooks(@CurrentUser('tenantId') tenantId: string, @Query() query: BookListQueryDto) {
    return this.books.list(tenantId, query);
  }

  @Get('books/categories')
  @ApiOperation({ summary: 'Distinct book categories for filters' })
  categories(@CurrentUser('tenantId') tenantId: string) {
    return this.books.categories(tenantId);
  }

  @Post('books')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Add a title to the catalogue (all copies available)' })
  createBook(@CurrentUser() user: AuthUser, @Body() dto: CreateBookDto) {
    return this.books.create(user, dto);
  }

  @Patch('books/:id')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Update a title; changing total copies shifts available copies by the same amount' })
  updateBook(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookDto) {
    return this.books.update(user, id, dto);
  }

  @Delete('books/:id')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Remove a title (refused while copies are issued)' })
  removeBook(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.books.remove(user, id);
  }

  // ---------- Issues ----------
  @Get('issues')
  @ApiOperation({ summary: 'Issue register (status issued|overdue|returned, borrower type, search) with running fines' })
  listIssues(@CurrentUser('tenantId') tenantId: string, @Query() query: IssueListQueryDto) {
    return this.issues.list(tenantId, query);
  }

  @Post('issues')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Issue a book to a student or staff member (due in 14 days by default)' })
  issue(@CurrentUser() user: AuthUser, @Body() dto: CreateIssueDto) {
    return this.issues.issue(user, dto);
  }

  @Post('issues/:id/return')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Return a book; records the late fine (computed unless given)' })
  returnBook(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReturnIssueDto) {
    return this.issues.returnBook(user, id, dto);
  }

  @Post('issues/:id/renew')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Extend the due date of an unreturned book' })
  renew(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RenewIssueDto) {
    return this.issues.renew(user, id, dto);
  }

  @Post('issues/:id/fine-paid')
  @RequirePermissions(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Mark the fine of a returned book as paid' })
  finePaid(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.issues.markFinePaid(user, id);
  }

  @Get('borrowers/:type/:id')
  @ApiOperation({ summary: "A student's or staff member's borrowing history" })
  @ApiParam({ name: 'type', enum: ['student', 'staff'] })
  borrower(
    @CurrentUser('tenantId') tenantId: string,
    @Param('type', new ParseEnumPipe(BorrowerTypeEnum)) type: BorrowerType,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.issues.borrowerHistory(tenantId, type, id);
  }
}
