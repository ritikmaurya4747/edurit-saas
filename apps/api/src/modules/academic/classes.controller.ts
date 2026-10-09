import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { ClassesService } from './classes.service';
import {
  ClassListQueryDto,
  CreateClassDto,
  CreateSectionDto,
  UpdateClassDto,
  UpdateSectionDto,
} from './dto/academic.dto';

@ApiTags('Academic - Classes & Sections')
@TenantAuth(PERMISSIONS.ACADEMIC_READ)
@Controller({ version: '1' })
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Get('classes')
  @ApiOperation({ summary: 'List classes with sections and current-year strength' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ClassListQueryDto) {
    return this.service.list(tenantId, query.branchId);
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Get class with sections' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post('classes')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Create class (optionally with sections)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClassDto) {
    return this.service.create(user, dto);
  }

  @Patch('classes/:id')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Update class' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClassDto) {
    return this.service.update(user, id, dto);
  }

  @Delete('classes/:id')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Delete class and its sections (only if no students this year)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }

  @Get('sections')
  @ApiOperation({ summary: 'Flat section list for dropdowns ("Class 8 - B")' })
  sections(@CurrentUser('tenantId') tenantId: string) {
    return this.service.listSections(tenantId);
  }

  @Post('classes/:classId/sections')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Add section to class' })
  addSection(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.service.addSection(user, classId, dto);
  }

  @Patch('sections/:id')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Update section' })
  updateSection(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSectionDto) {
    return this.service.updateSection(user, id, dto);
  }

  @Delete('sections/:id')
  @RequirePermissions(PERMISSIONS.CLASS_MANAGE)
  @ApiOperation({ summary: 'Delete section (only if no students this year)' })
  removeSection(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeSection(user, id);
  }
}
