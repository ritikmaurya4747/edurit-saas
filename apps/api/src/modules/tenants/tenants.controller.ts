import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { TenantsService } from './tenants.service';
import { UpdateSchoolSettingsDto } from './dto/tenants.dto';

@ApiTags('Administration - School Settings')
@TenantAuth()
@Controller({ path: 'settings', version: '1' })
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('school')
  @ApiOperation({ summary: 'School profile, regional settings, subscription and usage' })
  getSchool(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getSchool(tenantId);
  }

  @Patch('school')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update school name, profile, logo, currency and timezone' })
  updateSchool(@CurrentUser() user: AuthUser, @Body() dto: UpdateSchoolSettingsDto) {
    return this.service.updateSchool(user, dto);
  }
}
