import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic.dto';

@ApiTags('Academic - Years')
@TenantAuth(PERMISSIONS.ACADEMIC_READ)
@Controller({ path: 'academic-years', version: '1' })
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: 'List academic years (newest first)' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Current academic year (null if none)' })
  current(@CurrentUser('tenantId') tenantId: string) {
    return this.service.current(tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ACADEMIC_YEAR_MANAGE)
  @ApiOperation({ summary: 'Create academic year' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAcademicYearDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ACADEMIC_YEAR_MANAGE)
  @ApiOperation({ summary: 'Update academic year' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/set-current')
  @RequirePermissions(PERMISSIONS.ACADEMIC_YEAR_MANAGE)
  @ApiOperation({ summary: 'Mark academic year as current' })
  setCurrent(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.setCurrent(user, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ACADEMIC_YEAR_MANAGE)
  @ApiOperation({ summary: 'Delete academic year (only if unused)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
