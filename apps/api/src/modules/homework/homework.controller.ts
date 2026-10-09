import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto, HomeworkListQueryDto, UpdateHomeworkDto, UpsertSubmissionDto } from './dto/homework.dto';

@ApiTags('Homework')
@TenantAuth(PERMISSIONS.HOMEWORK_READ)
@Controller({ path: 'homework', version: '1' })
export class HomeworkController {
  constructor(private readonly service: HomeworkService) {}

  @Get()
  @ApiOperation({ summary: 'List homework with submission progress' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: HomeworkListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Homework detail with the section roster and submissions' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: 'Assign homework to a section' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHomeworkDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: 'Update homework' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHomeworkDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: 'Delete homework' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }

  @Put(':id/submissions/:studentId')
  @RequirePermissions(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: "Record, grade or clear a student's submission" })
  upsertSubmission(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: UpsertSubmissionDto,
  ) {
    return this.service.upsertSubmission(user, id, studentId, dto);
  }
}
