import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StaffAppraisalsService } from './staff-appraisals.service';
import { AppraisalListQueryDto, CreateAppraisalDto, UpdateAppraisalDto } from './dto/staff.dto';

@ApiTags('Staff & HR - Appraisals')
@TenantAuth(PERMISSIONS.STAFF_READ)
@Controller({ path: 'staff-appraisals', version: '1' })
export class StaffAppraisalsController {
  constructor(private readonly service: StaffAppraisalsService) {}

  @Get()
  @ApiOperation({ summary: 'Appraisals (filter by period and status)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: AppraisalListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Appraisal periods that already exist' })
  periods(@CurrentUser('tenantId') tenantId: string) {
    return this.service.periods(tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_UPDATE)
  @ApiOperation({ summary: 'Create an appraisal, or start the cycle for all active staff when staffId is omitted' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppraisalDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STAFF_UPDATE)
  @ApiOperation({ summary: 'Record rating / remarks and complete the appraisal' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAppraisalDto) {
    return this.service.update(user, id, dto);
  }
}
