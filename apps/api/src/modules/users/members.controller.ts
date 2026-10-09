import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { MembersService } from './members.service';
import { ListMembersQueryDto, SetMemberRolesDto, SetMemberStatusDto } from './dto/users.dto';

@ApiTags('Administration - Users & Access')
@TenantAuth(PERMISSIONS.ROLES_MANAGE)
@Controller({ path: 'members', version: '1' })
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List school users (search by name/email, filter by role or status)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ListMembersQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Put(':membershipId/roles')
  @ApiOperation({ summary: "Replace a user's roles (keeps at least one active administrator)" })
  setRoles(
    @CurrentUser() user: AuthUser,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: SetMemberRolesDto,
  ) {
    return this.service.setRoles(user, membershipId, dto);
  }

  @Post(':membershipId/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a one-time temporary password (user must change it at next login)' })
  resetPassword(@CurrentUser() user: AuthUser, @Param('membershipId', ParseUUIDPipe) membershipId: string) {
    return this.service.resetPassword(user, membershipId);
  }

  @Post(':membershipId/status')
  @ApiOperation({ summary: 'Suspend or re-activate a user (not yourself, not the last administrator)' })
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: SetMemberStatusDto,
  ) {
    return this.service.setStatus(user, membershipId, dto);
  }
}
