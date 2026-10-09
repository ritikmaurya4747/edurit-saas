import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const STUDENT_STATUSES = ['ACTIVE', 'ALUMNI', 'TRANSFERRED', 'DROPPED'] as const;
export const GUARDIAN_RELATIONSHIPS = ['FATHER', 'MOTHER', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'UNCLE', 'AUNT', 'OTHER'] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
// Empty strings from HTML forms mean "not provided".
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() === '' ? undefined : value.trim()) : value;

// ---------- Guardian ----------
export class GuardianInputDto {
  @ApiProperty({ example: 'Rakesh' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  lastName?: string;

  @ApiProperty({ example: 'FATHER', enum: GUARDIAN_RELATIONSHIPS })
  @Transform(upper)
  @IsIn(GUARDIAN_RELATIONSHIPS as unknown as string[])
  relationship: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  // At least 6 digits in total; spaces, dashes, brackets and a leading + are
  // allowed ("+91 98765 43210").
  @Matches(/^\+?[\d\s().-]*$/, { message: 'Phone may only contain digits, spaces, dashes and a leading +' })
  @Matches(/^(?:\D*\d){6,}\D*$/, { message: 'Phone must contain at least 6 digits' })
  phone: string;

  @ApiPropertyOptional({ example: 'rakesh@example.com' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Engineer' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(128)
  occupation?: string;
}

// ---------- Student ----------
export class CreateStudentDto {
  @ApiProperty({ example: 'Aarav' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  lastName?: string;

  @ApiPropertyOptional({ example: 'ADM-2026-0001', description: 'Auto-generated (ADM-<yyyy>-<0001>) when empty' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(48)
  admissionNumber?: string;

  @ApiProperty({ example: '2014-06-15' })
  @IsDateString()
  dob: string;

  @ApiProperty({ example: 'MALE', enum: GENDERS })
  @Transform(upper)
  @IsIn(GENDERS as unknown as string[])
  gender: string;

  @ApiPropertyOptional({ example: 'B+' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(8)
  bloodGroup?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'aarav@example.com' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '12 MG Road, Pune' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(1000)
  address?: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Defaults to today' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ description: "Defaults to the section's branch" })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  branchId?: string;

  @ApiProperty({ description: 'Section to enrol the student in' })
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ example: 12, description: 'Defaults to the next free roll number in the section' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  rollNumber?: number;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ type: GuardianInputDto, description: 'Primary parent / guardian' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianInputDto)
  guardian?: GuardianInputDto;
}

export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['sectionId', 'rollNumber', 'academicYearId', 'guardian'] as const),
) {
  @ApiPropertyOptional({ enum: STUDENT_STATUSES })
  @IsOptional()
  @Transform(upper)
  @IsIn(STUDENT_STATUSES as unknown as string[])
  status?: (typeof STUDENT_STATUSES)[number];
}

export class StudentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ enum: [...STUDENT_STATUSES, 'ALL'], default: 'ACTIVE' })
  @IsOptional()
  @Transform(upper)
  @IsIn([...STUDENT_STATUSES, 'ALL'])
  status?: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class StudentOptionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Name or admission number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class UpdateEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  rollNumber?: number;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class PromoteStudentsDto {
  @ApiProperty()
  @IsUUID()
  fromSectionId: string;

  @ApiProperty()
  @IsUUID()
  toSectionId: string;

  @ApiProperty()
  @IsUUID()
  toAcademicYearId: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  fromAcademicYearId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Defaults to every ACTIVE student enrolled in the from-section' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  studentIds?: string[];
}

export class AddGuardianDto {
  @ApiPropertyOptional({ description: 'Link an existing parent instead of creating one' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Sunita' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(128)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(128)
  lastName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(128)
  occupation?: string;

  @ApiProperty({ example: 'MOTHER', enum: GUARDIAN_RELATIONSHIPS })
  @Transform(upper)
  @IsIn(GUARDIAN_RELATIONSHIPS as unknown as string[])
  relationship: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ParentListQueryDto extends PaginationQueryDto {}
