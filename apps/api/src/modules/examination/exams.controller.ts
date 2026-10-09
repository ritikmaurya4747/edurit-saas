import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { ExamsService } from './exams.service';
import { MarksService } from './marks.service';
import {
  CreateExamDto,
  CreateExamSubjectDto,
  ExamListQueryDto,
  PublishExamDto,
  SaveMarksDto,
  SectionQueryDto,
  UpdateExamDto,
  UpdateExamSubjectDto,
} from './dto/examination.dto';

@ApiTags('Examination - Exams & Marks')
@TenantAuth(PERMISSIONS.EXAM_READ)
@Controller({ version: '1' })
export class ExamsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly marks: MarksService,
  ) {}

  // ---------- Exams ----------
  @Get('exams')
  @ApiOperation({ summary: 'List exams of an academic year (default: current) with schedule and marks counts' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ExamListQueryDto) {
    return this.exams.list(tenantId, query.academicYearId);
  }

  @Post('exams')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Create exam' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExamDto) {
    return this.exams.create(user, dto);
  }

  @Get('exams/:id')
  @ApiOperation({ summary: 'Get exam with its subject schedule' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.get(tenantId, id);
  }

  @Patch('exams/:id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Update exam name / dates' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamDto) {
    return this.exams.update(user, id, dto);
  }

  @Delete('exams/:id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Delete exam (only when no marks are entered)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.remove(user, id);
  }

  @Post('exams/:id/publish')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Publish or unpublish exam results (published exams lock marks entry)' })
  publish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishExamDto) {
    return this.exams.publish(user, id, dto.isPublished);
  }

  // ---------- Schedule ----------
  @Post('exams/:id/subjects')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Add a subject paper to the exam schedule' })
  addSubject(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateExamSubjectDto) {
    return this.exams.addSubject(user, id, dto);
  }

  @Patch('exam-subjects/:id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Update a scheduled paper (date, max/passing marks, paper link)' })
  updateSubject(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamSubjectDto) {
    return this.exams.updateSubject(user, id, dto);
  }

  @Delete('exam-subjects/:id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Remove a paper from the schedule (only when no marks are entered)' })
  removeSubject(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exams.removeSubject(user, id);
  }

  // ---------- Marks ----------
  @Get('exam-subjects/:id/marks')
  @ApiOperation({ summary: 'Marks roster of a section for one paper' })
  getMarks(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SectionQueryDto,
  ) {
    return this.marks.getMarks(tenantId, id, query.sectionId);
  }

  @Put('exam-subjects/:id/marks')
  @RequirePermissions(PERMISSIONS.MARKS_ENTRY)
  @ApiOperation({ summary: 'Save marks for a section (null marks = absent / clears the mark)' })
  saveMarks(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveMarksDto) {
    return this.marks.saveMarks(user, id, dto);
  }

  // ---------- Results ----------
  @Get('exams/:id/results')
  @ApiOperation({ summary: 'Section result matrix with totals, grades, pass/fail and ranks' })
  results(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SectionQueryDto,
  ) {
    return this.marks.sectionResults(tenantId, id, query.sectionId);
  }
}
