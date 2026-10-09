import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StaffService } from './staff.service';
import { CreateStaffDto, StaffListQueryDto, UpdateStaffDto, UpdateStaffStatusDto } from './dto/staff.dto';

@ApiTags('Staff & HR - Directory')
@TenantAuth(PERMISSIONS.STAFF_READ)
@Controller({ path: 'staff', version: '1' })
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'Staff directory (paginated; filter by search, department, designation, status, teaching)' })
  list(@CurrentUser() user: AuthUser, @Query() query: StaffListQueryDto) {
    return this.service.list(user, query);
  }

  @Get('options')
  @RequirePermissions(PERMISSIONS.ACADEMIC_READ)
  @ApiOperation({ summary: 'Active staff for dropdowns: { id, name, employeeCode, designation, department, isTeachingStaff }[]' })
  options(@CurrentUser('tenantId') tenantId: string) {
    return this.service.options(tenantId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Distinct department names (filters / autocomplete)' })
  departments(@CurrentUser('tenantId') tenantId: string) {
    return this.service.departments(tenantId);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Roles that can be assigned to staff (excludes student / parent)' })
  roles(@CurrentUser('tenantId') tenantId: string) {
    return this.service.roles(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Staff profile with roles, leave summary (this year) and attendance (this month)' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_CREATE)
  @ApiOperation({
    summary: 'Add staff member (creates or links the login account, membership + role and staff profile)',
    description: 'The response contains `temporaryPassword` once when a new login account was created.',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STAFF_UPDATE)
  @ApiOperation({ summary: 'Update staff profile, name / phone and role' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/status')
  @RequirePermissions(PERMISSIONS.STAFF_UPDATE)
  @ApiOperation({ summary: 'Change employment status (resigned / terminated suspends the login)' })
  setStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffStatusDto) {
    return this.service.setStatus(user, id, dto.status);
  }

  @Post(':id/reset-password')
  @RequirePermissions(PERMISSIONS.STAFF_UPDATE)
  @ApiOperation({ summary: 'Set a new random password and return it once ({ temporaryPassword })' })
  resetPassword(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resetPassword(user, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_DELETE)
  @ApiOperation({ summary: 'Remove staff member (soft delete, suspends the login)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
