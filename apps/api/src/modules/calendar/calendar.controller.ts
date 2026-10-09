import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { CalendarService } from './calendar.service';
import {
  CalendarEventsQueryDto,
  CalendarRangeQueryDto,
  CreateCalendarEventDto,
  ImportHolidaysDto,
  UpdateCalendarEventDto,
  UpcomingEventsQueryDto,
} from './dto/calendar.dto';

@ApiTags('Academic Calendar')
@TenantAuth(PERMISSIONS.ACADEMIC_READ)
@Controller({ path: 'calendar', version: '1' })
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get('events')
  @ApiOperation({
    summary: 'Calendar items overlapping a date range (defaults to the current month)',
    description:
      'Returns school events plus scheduled exams (source = EXAM, read-only). Users without calendar:manage only ' +
      'see events addressed to everyone or to one of their roles.',
  })
  events(@CurrentUser() user: AuthUser, @Query() query: CalendarEventsQueryDto) {
    return this.service.events(user, query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Next events and exams from today (school timezone)' })
  upcoming(@CurrentUser() user: AuthUser, @Query() query: UpcomingEventsQueryDto) {
    return this.service.upcoming(user, query);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Holiday dates in a range, expanded to individual YYYY-MM-DD days' })
  holidays(@CurrentUser() user: AuthUser, @Query() query: CalendarRangeQueryDto) {
    return this.service.holidays(user, query);
  }

  @Post('events')
  @RequirePermissions(PERMISSIONS.CALENDAR_MANAGE)
  @ApiOperation({ summary: 'Add a calendar event or holiday' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCalendarEventDto) {
    return this.service.create(user, dto);
  }

  @Post('events/import-holidays')
  @RequirePermissions(PERMISSIONS.CALENDAR_MANAGE)
  @ApiOperation({
    summary: 'Add the fixed-date national holidays (Republic Day, Independence Day, Gandhi Jayanti) for a year',
    description: 'Holidays already present with the same title and date are skipped.',
  })
  importHolidays(@CurrentUser() user: AuthUser, @Body() dto: ImportHolidaysDto) {
    return this.service.importHolidays(user, dto);
  }

  @Patch('events/:id')
  @RequirePermissions(PERMISSIONS.CALENDAR_MANAGE)
  @ApiOperation({ summary: 'Update a calendar event' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.service.update(user, id, dto);
  }

  @Delete('events/:id')
  @RequirePermissions(PERMISSIONS.CALENDAR_MANAGE)
  @ApiOperation({ summary: 'Delete a calendar event' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
