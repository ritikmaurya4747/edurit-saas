import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StudentLeavesService } from './student-leaves.service';
import { CreateStudentLeaveDto, StudentLeaveListQueryDto, UpdateStudentLeaveStatusDto } from './dto/attendance.dto';

@ApiTags('Attendance - Student Leaves')
@TenantAuth(PERMISSIONS.ATTENDANCE_READ)
@Controller({ path: 'student-leaves', version: '1' })
export class StudentLeavesController {
  constructor(private readonly service: StudentLeavesService) {}

  @Get()
  @ApiOperation({ summary: 'List student leave requests (pending first)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: StudentLeaveListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_MARK)
  @ApiOperation({ summary: 'Record a leave request for a student' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStudentLeaveDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_APPROVE_LEAVE)
  @ApiOperation({ summary: 'Approve or reject a pending leave request' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentLeaveStatusDto,
  ) {
    return this.service.updateStatus(user, id, dto);
  }
}
