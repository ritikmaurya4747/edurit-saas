import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TimetableQueryDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class StaffTimetableQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class UpsertTimetableEntryDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: 1, description: '0 = Sunday, 1 = Monday … 6 = Saturday' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodNumber: number;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ description: 'Teacher (Staff id)' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ example: '09:20' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Start time must be in HH:MM (24-hour) format' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'End time must be in HH:MM (24-hour) format' })
  endTime: string;

  @ApiPropertyOptional({ example: '204' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class CopyTimetableDto {
  @ApiProperty({ description: 'Section to copy from' })
  @IsUUID()
  fromSectionId: string;

  @ApiProperty({ description: 'Section to copy into' })
  @IsUUID()
  toSectionId: string;

  @ApiPropertyOptional({ description: 'Target academic year (defaults to current)' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Source academic year (defaults to the target year), e.g. to reuse last year' })
  @IsOptional()
  @IsUUID()
  fromAcademicYearId?: string;

  @ApiPropertyOptional({ default: false, description: 'Overwrite periods already filled in the target section' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  replaceExisting?: boolean;
}
