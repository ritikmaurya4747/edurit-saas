import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { AdmissionsService } from './admissions.service';
import {
  AdmissionListQueryDto,
  AdmitEnquiryDto,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  UpdateOnlineFormSettingsDto,
  UpdateStageDto,
} from './dto/admissions.dto';

@ApiTags('Admissions')
@TenantAuth(PERMISSIONS.ADMISSIONS_READ)
@Controller({ path: 'admissions', version: '1' })
export class AdmissionsController {
  constructor(private readonly service: AdmissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List admission enquiries (newest first, max 500)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: AdmissionListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Enquiry count per stage, total and conversion rate (%)' })
  stats(@CurrentUser('tenantId') tenantId: string) {
    return this.service.stats(tenantId);
  }

  @Get('online-form/settings')
  @ApiOperation({ summary: 'Online admission form settings (enabled, message, classes offered) and its public path' })
  getOnlineFormSettings(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getOnlineFormSettings(tenantId);
  }

  @Put('online-form/settings')
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Enable/disable the public online admission form and set its message and classes' })
  updateOnlineFormSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateOnlineFormSettingsDto) {
    return this.service.updateOnlineFormSettings(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an admission enquiry' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Create an admission enquiry' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAdmissionDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Update an enquiry (incl. entrance test date / score)' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdmissionDto) {
    return this.service.update(user, id, dto);
  }

  @Patch(':id/stage')
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Move an enquiry to another pipeline stage' })
  changeStage(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStageDto) {
    return this.service.changeStage(user, id, dto);
  }

  @Post(':id/admit')
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE, PERMISSIONS.STUDENT_CREATE)
  @ApiOperation({ summary: 'Admit the applicant: creates the student, enrollment and parent login' })
  admit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AdmitEnquiryDto) {
    return this.service.admit(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Delete an enquiry (not allowed once admitted)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
