import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/users.dto';

@ApiTags('Administration - Roles & Permissions')
@TenantAuth(PERMISSIONS.ROLES_MANAGE)
@Controller({ version: '1' })
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Permission catalogue grouped by module' })
  permissions() {
    return this.service.listPermissions();
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles with member counts and permission codes (ADMIN first)' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.service.listRoles(tenantId);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a custom role' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoleDto) {
    return this.service.create(user, dto);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Rename a custom role and/or replace its permissions (ADMIN is read-only)' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(user, id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a custom role that has no members' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
