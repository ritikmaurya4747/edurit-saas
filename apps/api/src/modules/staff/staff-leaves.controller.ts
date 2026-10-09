import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StaffLeavesService } from './staff-leaves.service';
import { CreateStaffLeaveDto, StaffLeaveListQueryDto, UpdateStaffLeaveStatusDto } from './dto/staff.dto';

// No class-level permission: any signed-in staff member can apply for, list and
// cancel their own leave. Approvers (staff_leave:approve) see and act on everyone's.
@ApiTags('Staff & HR - Leaves')
@TenantAuth()
@Controller({ path: 'staff-leaves', version: '1' })
export class StaffLeavesController {
  constructor(private readonly service: StaffLeavesService) {}

  @Get()
  @ApiOperation({ summary: 'Leave requests (approvers see everyone, others only their own)' })
  list(@CurrentUser() user: AuthUser, @Query() query: StaffLeaveListQueryDto) {
    return this.service.list(user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Apply for leave (for yourself, or for any staff member with staff_leave:approve)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffLeaveDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.STAFF_LEAVE_APPROVE)
  @ApiOperation({ summary: 'Approve or reject a pending leave request' })
  setStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffLeaveStatusDto) {
    return this.service.setStatus(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending leave request (your own, or anyone with staff_leave:approve)' })
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(user, id);
  }
}
