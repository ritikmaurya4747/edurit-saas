import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/academic.dto';

@ApiTags('Academic - Branches')
@TenantAuth()
@Controller({ path: 'branches', version: '1' })
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ACADEMIC_READ)
  @ApiOperation({ summary: 'List branches / campuses' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCH_CREATE)
  @ApiOperation({ summary: 'Create branch' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBranchDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANCH_UPDATE)
  @ApiOperation({ summary: 'Update branch' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BRANCH_DELETE)
  @ApiOperation({ summary: 'Delete branch (only if empty)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
