import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { AttendanceService } from './attendance.service';
import {
  DateRangeQueryDto,
  MarkAttendanceDto,
  ReportQueryDto,
  RosterQueryDto,
  SummaryQueryDto,
  TrendQueryDto,
} from './dto/attendance.dto';

@ApiTags('Attendance')
@TenantAuth(PERMISSIONS.ATTENDANCE_READ)
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('roster')
  @ApiOperation({ summary: 'Students of a section with their attendance for a date (for marking)' })
  roster(@CurrentUser('tenantId') tenantId: string, @Query() query: RosterQueryDto) {
    return this.service.roster(tenantId, query);
  }

  @Post('mark')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_MARK)
  @ApiOperation({ summary: 'Mark or update attendance for a section and date' })
  mark(@CurrentUser() user: AuthUser, @Body() dto: MarkAttendanceDto) {
    return this.service.mark(user, dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'School-wide daily summary per section (full-day attendance)' })
  summary(@CurrentUser('tenantId') tenantId: string, @Query() query: SummaryQueryDto) {
    return this.service.summary(tenantId, query);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Monthly attendance percentage, oldest to newest' })
  trend(@CurrentUser('tenantId') tenantId: string, @Query() query: TrendQueryDto) {
    return this.service.trend(tenantId, query);
  }

  @Get('report')
  @ApiOperation({ summary: 'Section register: per-student totals over a date range' })
  report(@CurrentUser('tenantId') tenantId: string, @Query() query: ReportQueryDto) {
    return this.service.report(tenantId, query);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: "A student's day-wise attendance with summary" })
  student(
    @CurrentUser('tenantId') tenantId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.service.studentHistory(tenantId, studentId, query);
  }
}
