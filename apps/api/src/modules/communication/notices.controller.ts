import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { NoticesService } from './notices.service';
import { CreateNoticeDto, NoticeListQueryDto, UpdateNoticeDto } from './dto/notice.dto';

@ApiTags('Communication - Notices')
@TenantAuth(PERMISSIONS.NOTICE_READ)
@Controller({ path: 'notices', version: '1' })
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Get()
  @ApiOperation({
    summary: 'List notices',
    description: 'Publishers see all notices; other users only see published notices addressed to them.',
  })
  list(@CurrentUser() user: AuthUser, @Query() query: NoticeListQueryDto) {
    return this.service.list(user, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Notice counts by status' })
  stats(@CurrentUser() user: AuthUser) {
    return this.service.stats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notice' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.NOTICE_PUBLISH)
  @ApiOperation({ summary: 'Create a notice (published immediately unless status = DRAFT)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoticeDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.NOTICE_PUBLISH)
  @ApiOperation({ summary: 'Update a notice' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoticeDto) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.NOTICE_PUBLISH)
  @ApiOperation({ summary: 'Publish a draft or archived notice' })
  publish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.publish(user, id);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMISSIONS.NOTICE_PUBLISH)
  @ApiOperation({ summary: 'Archive a notice' })
  archive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.archive(user, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.NOTICE_PUBLISH)
  @ApiOperation({ summary: 'Delete a notice' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
