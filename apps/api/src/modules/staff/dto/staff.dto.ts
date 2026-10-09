import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus, LeaveStatus, StaffStatus } from '@edurit/database';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LEAVE_TYPES } from '../staff-hr.utils';

const toBool = ({ value }: { value: unknown }) => value === 'true' || value === true;

// ============================== Staff directory ==============================
export class StaffListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  designation?: string;

  @ApiPropertyOptional({ enum: StaffStatus, description: 'Defaults to every status (deleted staff are never listed)' })
  @IsOptional()
  @IsIn(Object.values(StaffStatus))
  status?: StaffStatus;

  @ApiPropertyOptional({ description: 'true = teaching staff only, false = non-teaching only' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isTeachingStaff?: boolean;
}

export class CreateStaffDto {
  @ApiProperty({ example: 'Anita' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  lastName: string;

  @ApiProperty({ example: 'anita.sharma@school.edu' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ description: 'Initial password (min 8). Generated automatically when omitted.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ example: 'EMP-0007', description: 'Auto-generated (EMP-0001…) when omitted' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9/_-]+$/, { message: 'Employee code may contain letters, numbers, /, - and _' })
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Senior Teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  designation?: string;

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  department?: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 45000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  basicSalary?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTeachingStaff?: boolean;

  @ApiPropertyOptional({ example: 'Physics' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  specialization?: string;

  @ApiPropertyOptional({ description: 'Defaults to the first branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'TEACHER', default: 'TEACHER', description: 'Role code from the school role list' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleCode?: string;
}

export class UpdateStaffDto extends PartialType(OmitType(CreateStaffDto, ['email', 'password'] as const)) {}

export class UpdateStaffStatusDto {
  @ApiProperty({ enum: StaffStatus })
  @IsIn(Object.values(StaffStatus))
  status: StaffStatus;
}

// ================================ Leaves =====================================
export class StaffLeaveListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LeaveStatus })
  @IsOptional()
  @IsIn(Object.values(LeaveStatus))
  status?: LeaveStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Leaves ending on/after this date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Leaves starting on/before this date' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateStaffLeaveDto {
  @ApiPropertyOptional({ description: 'Defaults to your own staff profile. Others require staff_leave:approve.' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({ enum: LEAVE_TYPES, example: 'CASUAL' })
  @IsIn(LEAVE_TYPES as unknown as string[])
  leaveType: string;

  @ApiProperty({ example: '2026-10-12' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-13' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Family function' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;
}

export class UpdateStaffLeaveStatusDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status: LeaveStatus;

  @ApiPropertyOptional({ example: 'Exams week — please reschedule' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionReason?: string;
}

// ============================ Staff attendance ===============================
export class StaffAttendanceDateQueryDto {
  @ApiPropertyOptional({ example: '2026-10-09', description: 'Defaults to today (school timezone)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class StaffCheckDto {
  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiPropertyOptional({ example: '2026-10-09', description: 'Defaults to the date of `time` in the school timezone' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2026-10-09T03:10:00.000Z', description: 'ISO instant; defaults to now' })
  @IsOptional()
  @IsDateString()
  time?: string;
}

const MARKABLE_STATUSES = Object.values(AttendanceStatus);

export class StaffAttendanceBulkItemDto {
  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsIn(MARKABLE_STATUSES)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class StaffAttendanceBulkDto {
  @ApiProperty({ example: '2026-10-09' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [StaffAttendanceBulkItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => StaffAttendanceBulkItemDto)
  records: StaffAttendanceBulkItemDto[];
}

export class MonthQueryDto {
  @ApiPropertyOptional({ example: 10, description: 'Defaults to the current month' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Defaults to the current year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

// ================================ Payroll ====================================
export class PayrollPeriodDto {
  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}

export class UpdatePayrollDto {
  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  basicSalary?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  allowances?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  deductions?: number;
}

// =============================== Appraisals ==================================
export const APPRAISAL_STATUSES = ['PENDING', 'COMPLETED'] as const;

export class AppraisalListQueryDto {
  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  period?: string;

  @ApiPropertyOptional({ enum: APPRAISAL_STATUSES })
  @IsOptional()
  @IsIn(APPRAISAL_STATUSES as unknown as string[])
  status?: string;
}

export class CreateAppraisalDto {
  @ApiPropertyOptional({ description: 'Omit to start the cycle for every active staff member' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({ example: '2026-27' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  period: string;
}

export class UpdateAppraisalDto {
  @ApiPropertyOptional({ example: 4.5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Excellent classroom engagement' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  remarks?: string;

  @ApiPropertyOptional({ enum: APPRAISAL_STATUSES })
  @IsOptional()
  @IsIn(APPRAISAL_STATUSES as unknown as string[])
  status?: string;
}
