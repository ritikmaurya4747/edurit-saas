import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { ReportCardsService } from './report-cards.service';
import {
  GenerateReportCardsDto,
  ReportCardListQueryDto,
  ReportCardStudentQueryDto,
  UpdateReportCardDto,
} from './dto/examination.dto';

@ApiTags('Examination - Report Cards')
@TenantAuth(PERMISSIONS.EXAM_READ)
@Controller({ version: '1' })
export class ReportCardsController {
  constructor(private readonly service: ReportCardsService) {}

  @Post('exams/:id/report-cards/generate')
  @RequirePermissions(PERMISSIONS.REPORT_CARD_GENERATE)
  @ApiOperation({ summary: 'Generate / refresh report cards for an exam (optionally one section)' })
  generate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: GenerateReportCardsDto) {
    return this.service.generate(user, id, dto);
  }

  @Get('report-cards')
  @ApiOperation({ summary: 'List generated report cards of an exam' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ReportCardListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('report-cards/student/:studentId')
  @ApiOperation({ summary: 'Full report card of a student for an exam (computed live if not generated yet)' })
  student(
    @CurrentUser('tenantId') tenantId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: ReportCardStudentQueryDto,
  ) {
    return this.service.studentCard(tenantId, studentId, query.examId);
  }

  @Patch('report-cards/:id')
  @RequirePermissions(PERMISSIONS.REPORT_CARD_GENERATE)
  @ApiOperation({ summary: 'Update teacher remarks on a report card' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReportCardDto) {
    return this.service.updateRemarks(user, id, dto);
  }
}
