import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StaffAttendanceService } from './staff-attendance.service';
import { MonthQueryDto, StaffAttendanceBulkDto, StaffAttendanceDateQueryDto, StaffCheckDto } from './dto/staff.dto';

@ApiTags('Staff & HR - Attendance')
@TenantAuth(PERMISSIONS.STAFF_READ)
@Controller({ path: 'staff-attendance', version: '1' })
export class StaffAttendanceController {
  constructor(private readonly service: StaffAttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Daily roster: every active staff member with their record and on-leave flag' })
  roster(@CurrentUser('tenantId') tenantId: string, @Query() query: StaffAttendanceDateQueryDto) {
    return this.service.roster(tenantId, query.date);
  }

  @Get('report')
  @ApiOperation({ summary: 'Monthly attendance report per staff member' })
  report(@CurrentUser('tenantId') tenantId: string, @Query() query: MonthQueryDto) {
    return this.service.report(tenantId, query);
  }

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.STAFF_ATTENDANCE_MANAGE)
  @ApiOperation({ summary: 'Record check-in (PRESENT, or LATE after 08:15 school time)' })
  checkIn(@CurrentUser() user: AuthUser, @Body() dto: StaffCheckDto) {
    return this.service.checkIn(user, dto);
  }

  @Post('check-out')
  @RequirePermissions(PERMISSIONS.STAFF_ATTENDANCE_MANAGE)
  @ApiOperation({ summary: 'Record check-out' })
  checkOut(@CurrentUser() user: AuthUser, @Body() dto: StaffCheckDto) {
    return this.service.checkOut(user, dto);
  }

  @Put('bulk')
  @RequirePermissions(PERMISSIONS.STAFF_ATTENDANCE_MANAGE)
  @ApiOperation({ summary: 'Set attendance status for many staff members on a date' })
  bulk(@CurrentUser() user: AuthUser, @Body() dto: StaffAttendanceBulkDto) {
    return this.service.bulkMark(user, dto);
  }
}
