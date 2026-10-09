import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus, LeaveStatus } from '@edurit/database';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// ---------- Marking ----------
export class RosterQueryDto {
  @ApiProperty({ description: 'Section to load' })
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ example: '2026-10-09', description: "Defaults to today (school timezone)" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: '0 = full-day attendance, 1..12 = period-wise' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  periodNumber?: number;
}

export class AttendanceRecordInputDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Came with parent at 9:15' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: '2026-10-09' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: '0 = full-day attendance' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  periodNumber?: number;

  @ApiProperty({ type: [AttendanceRecordInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Mark at least one student' })
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordInputDto)
  records: AttendanceRecordInputDto[];
}

// ---------- Analytics ----------
export class SummaryQueryDto {
  @ApiPropertyOptional({ example: '2026-10-09', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class TrendQueryDto {
  @ApiPropertyOptional({ example: 6, default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;
}

export class DateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'Defaults to the first day of the current month' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ReportQueryDto extends DateRangeQueryDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;
}

// ---------- Student leaves ----------
export class StudentLeaveListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LeaveStatus })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ description: "Student's current-year section" })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class CreateStudentLeaveDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '2026-10-12' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-14' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Family function out of town' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

export class UpdateStudentLeaveStatusDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED], { message: 'Status must be APPROVED or REJECTED' })
  status: LeaveStatus;

  @ApiPropertyOptional({ example: 'Medical certificate required' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionReason?: string;
}
