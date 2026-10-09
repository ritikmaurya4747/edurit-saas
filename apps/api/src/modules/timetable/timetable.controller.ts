import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { TimetableService } from './timetable.service';
import { CopyTimetableDto, StaffTimetableQueryDto, TimetableQueryDto, UpsertTimetableEntryDto } from './dto/timetable.dto';

@ApiTags('Timetable')
@TenantAuth(PERMISSIONS.ACADEMIC_READ)
@Controller({ path: 'timetable', version: '1' })
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Get()
  @ApiOperation({ summary: "A section's weekly timetable (dayOfWeek 1 = Monday … 6 = Saturday)" })
  section(@CurrentUser('tenantId') tenantId: string, @Query() query: TimetableQueryDto) {
    return this.service.sectionTimetable(tenantId, query.sectionId, query.academicYearId);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: "A teacher's weekly schedule across sections" })
  staff(
    @CurrentUser('tenantId') tenantId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query() query: StaffTimetableQueryDto,
  ) {
    return this.service.staffTimetable(tenantId, staffId, query.academicYearId);
  }

  @Put('entries')
  @RequirePermissions(PERMISSIONS.TIMETABLE_MANAGE)
  @ApiOperation({ summary: 'Set the subject/teacher of a section period (409 if the teacher is busy elsewhere)' })
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertTimetableEntryDto) {
    return this.service.upsertEntry(user, dto);
  }

  @Delete('entries/:id')
  @RequirePermissions(PERMISSIONS.TIMETABLE_MANAGE)
  @ApiOperation({ summary: 'Clear a timetable period' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeEntry(user, id);
  }

  @Post('copy')
  @RequirePermissions(PERMISSIONS.TIMETABLE_MANAGE)
  @ApiOperation({ summary: 'Copy periods from one section to another (teacher clashes are skipped)' })
  copy(@CurrentUser() user: AuthUser, @Body() dto: CopyTimetableDto) {
    return this.service.copy(user, dto);
  }
}
