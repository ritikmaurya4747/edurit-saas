import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { PortalService } from './portal.service';
import { PortalAttendanceQueryDto, PortalHomeworkQueryDto, PortalLeaveDto } from './dto/portal.dto';

// Student / parent self-service. No permission codes: access is decided by
// identity in PortalAccessService (own Student row or linked children).
@ApiTags('Portal (students & parents)')
@TenantAuth()
@Controller({ path: 'portal', version: '1' })
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Portal identity: STUDENT or PARENT and the students this login can see' })
  me(@CurrentUser() user: AuthUser) {
    return this.service.me(user);
  }

  @Get('students/:studentId/overview')
  @ApiOperation({ summary: 'Home overview: attendance, fees, homework, latest result, today, notices, events' })
  overview(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.overview(user, studentId);
  }

  @Get('students/:studentId/attendance')
  @ApiOperation({ summary: 'Daily attendance for a month, summary and leave requests' })
  attendance(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: PortalAttendanceQueryDto,
  ) {
    return this.service.attendance(user, studentId, query.month);
  }

  @Post('students/:studentId/leaves')
  @ApiOperation({ summary: 'Apply for leave for a child (parents/guardians only)' })
  applyLeave(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: PortalLeaveDto,
  ) {
    return this.service.applyLeave(user, studentId, dto);
  }

  @Get('students/:studentId/homework')
  @ApiOperation({ summary: "Homework of the student's section with the student's own submission" })
  homework(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: PortalHomeworkQueryDto,
  ) {
    return this.service.homework(user, studentId, query.status);
  }

  @Get('students/:studentId/results')
  @ApiOperation({ summary: 'Results of published exams (subject marks, total, grade, rank in section)' })
  results(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.results(user, studentId);
  }

  @Get('students/:studentId/fees')
  @ApiOperation({ summary: 'Invoices, payments and totals for the student' })
  fees(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.fees(user, studentId);
  }

  @Get('students/:studentId/timetable')
  @ApiOperation({ summary: "Weekly timetable of the student's current section" })
  timetable(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.timetable(user, studentId);
  }

  @Get('students/:studentId/services')
  @ApiOperation({ summary: 'Library books issued and transport assignment' })
  services(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.services(user, studentId);
  }
}
