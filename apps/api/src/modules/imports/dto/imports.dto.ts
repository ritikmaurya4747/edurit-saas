import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// Rows arrive as the raw cell text of the spreadsheet (parsed in the browser).
// Every cell is optional at the DTO level: the import services check each
// value and report friendly per-row errors instead of rejecting the request.

export const MAX_VALIDATE_ROWS = 500;
export const MAX_COMMIT_ROWS = 200;

const Cell = (example?: string, max = 500) =>
  applyDecorators(ApiPropertyOptional({ example, maxLength: max }), IsOptional(), IsString(), MaxLength(max));

class ImportRowBase {
  @ApiProperty({ example: 2, description: 'Row number in the spreadsheet (header = row 1), echoed back in results' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  rowNumber: number;
}

// ================================================================ students
export class StudentImportRowDto extends ImportRowBase {
  @Cell('ADM-2026-0001') admissionNo?: string;
  @Cell('Aarav') firstName?: string;
  @Cell('Sharma') lastName?: string;
  @Cell('Male') gender?: string;
  @Cell('15-06-2014') dob?: string;
  @Cell('Class 5') className?: string;
  @Cell('A') section?: string;
  @Cell('12') rollNo?: string;
  @Cell('B+') bloodGroup?: string;
  @Cell('9876543210') studentMobile?: string;
  @Cell('aarav@example.com') studentEmail?: string;
  @Cell('12 MG Road, Pune', 2000) address?: string;
  @Cell('01-04-2026') admissionDate?: string;
  @Cell('Rakesh Sharma') fatherName?: string;
  @Cell('9876543210') fatherMobile?: string;
  @Cell('rakesh@example.com') fatherEmail?: string;
  @Cell('Sunita Sharma') motherName?: string;
  @Cell('9876501234') motherMobile?: string;
  @Cell('sunita@example.com') motherEmail?: string;
}

export class StudentImportOptionsDto {
  @ApiPropertyOptional({ default: false, description: 'Create classes / sections that do not exist yet (needs classes:manage)' })
  @IsOptional()
  @IsBoolean()
  createMissingClasses?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Commit only: issue a portal login for every imported student' })
  @IsOptional()
  @IsBoolean()
  createStudentLogins?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Commit only: issue portal logins for the parents' })
  @IsOptional()
  @IsBoolean()
  createParentLogins?: boolean;

  @ApiPropertyOptional({
    default: 0,
    description: 'Validate only: number of importable rows in earlier chunks of the same file (plan limit check)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  precedingRows?: number;

  @ApiPropertyOptional({
    description:
      'Validate only: importable rows per sectionKey in earlier chunks of the same file (section capacity check). ' +
      'Commit: rows per sectionKey in the whole file (capacity of sections created by the import).',
    example: { 'new:class5|A': 32 },
  })
  @IsOptional()
  @IsObject()
  sectionCounts?: Record<string, number>;
}

export class ValidateStudentImportDto {
  @ApiProperty({ type: [StudentImportRowDto], description: `Up to ${MAX_VALIDATE_ROWS} rows` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VALIDATE_ROWS)
  @ValidateNested({ each: true })
  @Type(() => StudentImportRowDto)
  rows: StudentImportRowDto[];

  @ApiPropertyOptional({ type: StudentImportOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentImportOptionsDto)
  options?: StudentImportOptionsDto;
}

export class CommitStudentImportDto {
  @ApiProperty({ type: [StudentImportRowDto], description: `Up to ${MAX_COMMIT_ROWS} rows` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_COMMIT_ROWS)
  @ValidateNested({ each: true })
  @Type(() => StudentImportRowDto)
  rows: StudentImportRowDto[];

  @ApiPropertyOptional({ type: StudentImportOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentImportOptionsDto)
  options?: StudentImportOptionsDto;
}

// ================================================================== staff
export class StaffImportRowDto extends ImportRowBase {
  @Cell('EMP-0007') employeeCode?: string;
  @Cell('Anita') firstName?: string;
  @Cell('Sharma') lastName?: string;
  @Cell('anita.sharma@school.edu') email?: string;
  @Cell('9876543210') mobile?: string;
  @Cell('Senior Teacher') designation?: string;
  @Cell('Science') department?: string;
  @Cell('Teacher') role?: string;
  @Cell('Yes') teachingStaff?: string;
  @Cell('01-06-2024') joiningDate?: string;
  @Cell('45000') basicSalary?: string;
  @Cell('MAIN') branchCode?: string;
}

export class StaffImportOptionsDto {
  @ApiPropertyOptional({
    default: 0,
    description: 'Validate only: number of importable rows in earlier chunks of the same file (plan limit check)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  precedingRows?: number;
}

export class ValidateStaffImportDto {
  @ApiProperty({ type: [StaffImportRowDto], description: `Up to ${MAX_VALIDATE_ROWS} rows` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VALIDATE_ROWS)
  @ValidateNested({ each: true })
  @Type(() => StaffImportRowDto)
  rows: StaffImportRowDto[];

  @ApiPropertyOptional({ type: StaffImportOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffImportOptionsDto)
  options?: StaffImportOptionsDto;
}

export class CommitStaffImportDto {
  @ApiProperty({ type: [StaffImportRowDto], description: `Up to ${MAX_COMMIT_ROWS} rows` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_COMMIT_ROWS)
  @ValidateNested({ each: true })
  @Type(() => StaffImportRowDto)
  rows: StaffImportRowDto[];

  @ApiPropertyOptional({ type: StaffImportOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffImportOptionsDto)
  options?: StaffImportOptionsDto;
}
