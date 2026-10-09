import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PortalAttendanceQueryDto {
  @ApiPropertyOptional({ example: '2026-10', description: 'Month to show (YYYY-MM). Defaults to the current month.' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must look like YYYY-MM' })
  month?: string;
}

export const HOMEWORK_FILTERS = ['pending', 'submitted', 'all'] as const;
export type HomeworkFilter = (typeof HOMEWORK_FILTERS)[number];

export class PortalHomeworkQueryDto {
  @ApiPropertyOptional({ enum: HOMEWORK_FILTERS, default: 'all' })
  @IsOptional()
  @IsIn(HOMEWORK_FILTERS)
  status?: HomeworkFilter;
}

export class PortalLeaveDto {
  @ApiProperty({ example: '2026-10-12', description: 'First day of leave (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-13', description: 'Last day of leave (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Family function out of town' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
