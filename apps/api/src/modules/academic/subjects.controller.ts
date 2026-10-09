import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/academic.dto';

@ApiTags('Academic - Subjects')
@TenantAuth(PERMISSIONS.ACADEMIC_READ)
@Controller({ path: 'subjects', version: '1' })
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List subjects' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SUBJECT_MANAGE)
  @ApiOperation({ summary: 'Create subject' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSubjectDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SUBJECT_MANAGE)
  @ApiOperation({ summary: 'Update subject' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubjectDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SUBJECT_MANAGE)
  @ApiOperation({ summary: 'Delete subject' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
