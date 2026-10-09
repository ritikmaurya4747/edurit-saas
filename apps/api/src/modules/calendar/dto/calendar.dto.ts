import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const CALENDAR_EVENT_TYPES = ['HOLIDAY', 'EVENT', 'EXAM', 'PTM', 'ACTIVITY', 'OTHER'] as const;
export const CALENDAR_TARGETS = ['ALL', 'STAFF', 'STUDENT', 'PARENT'] as const;

export type CalendarEventTypeValue = (typeof CALENDAR_EVENT_TYPES)[number];
export type CalendarTarget = (typeof CALENDAR_TARGETS)[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CalendarRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'Range start (YYYY-MM-DD). Defaults to the 1st of the current month' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'from must be a date in YYYY-MM-DD format' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Range end (YYYY-MM-DD). Defaults to the last day of the current month' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'to must be a date in YYYY-MM-DD format' })
  to?: string;
}

export class CalendarEventsQueryDto extends CalendarRangeQueryDto {
  @ApiPropertyOptional({ enum: CALENDAR_EVENT_TYPES, description: 'Only items of this type (EXAM also includes scheduled exams)' })
  @IsOptional()
  @IsIn(CALENDAR_EVENT_TYPES, { message: `Type must be one of ${CALENDAR_EVENT_TYPES.join(', ')}` })
  type?: CalendarEventTypeValue;
}

export class UpcomingEventsQueryDto {
  @ApiPropertyOptional({ example: 5, default: 5, description: 'Maximum number of items (1-50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 5;
}

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'Annual Sports Day' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Students report at 8:00 AM in sports uniform.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: CALENDAR_EVENT_TYPES, example: 'EVENT' })
  @IsIn(CALENDAR_EVENT_TYPES, { message: `Type must be one of ${CALENDAR_EVENT_TYPES.join(', ')}` })
  type: CalendarEventTypeValue;

  @ApiProperty({ example: '2026-11-14', description: 'YYYY-MM-DD' })
  @Matches(DATE_ONLY, { message: 'Start date must be in YYYY-MM-DD format' })
  startDate: string;

  @ApiProperty({ example: '2026-11-14', description: 'YYYY-MM-DD, on or after the start date' })
  @Matches(DATE_ONLY, { message: 'End date must be in YYYY-MM-DD format' })
  endDate: string;

  @ApiPropertyOptional({ description: 'School closed on these days. Defaults to true for HOLIDAY, false otherwise' })
  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @ApiPropertyOptional({ enum: CALENDAR_TARGETS, default: 'ALL', description: 'Audience of the event' })
  @IsOptional()
  @IsIn(CALENDAR_TARGETS, { message: `Audience must be one of ${CALENDAR_TARGETS.join(', ')}` })
  targetRole?: CalendarTarget;
}

export class UpdateCalendarEventDto extends PartialType(CreateCalendarEventDto) {}

export class ImportHolidaysDto {
  @ApiProperty({ example: 2026, description: 'Calendar year to add the national holidays for' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
