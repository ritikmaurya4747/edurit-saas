import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdmissionStage } from '@edurit/database';

// ONLINE_FORM is set by the public admission form (PublicModule); accepted here so
// staff can edit those enquiries without changing their source.
export const ADMISSION_SOURCES = ['WALK_IN', 'WEBSITE', 'REFERRAL', 'PHONE', 'SOCIAL_MEDIA', 'ONLINE_FORM', 'OTHER'] as const;
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
// Empty strings from HTML forms mean "not provided".
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() === '' ? undefined : value.trim()) : value;
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value;

export class AdmissionListQueryDto {
  @ApiPropertyOptional({ enum: AdmissionStage })
  @IsOptional()
  @IsEnum(AdmissionStage)
  stage?: AdmissionStage;

  @ApiPropertyOptional({ description: 'Student name, parent name or phone' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 'Class 1' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  classApplied?: string;
}

export class CreateAdmissionDto {
  @ApiProperty({ example: 'Aarav Sharma' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  studentName: string;

  @ApiPropertyOptional({ example: 'Rakesh Sharma' })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(255)
  parentName?: string | null;

  @ApiProperty({ example: '+91 98765 43210' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @Transform(emptyToNull)
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ example: '2019-05-20' })
  @IsOptional()
  @Transform(emptyToNull)
  @IsDateString()
  dob?: string | null;

  @ApiPropertyOptional({ enum: GENDERS })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim().toUpperCase()) : value))
  @IsIn(GENDERS)
  gender?: string | null;

  @ApiProperty({ example: 'Class 1' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  classApplied: string;

  @ApiPropertyOptional({ enum: ADMISSION_SOURCES, default: 'WALK_IN' })
  @IsOptional()
  @Transform(upper)
  @IsIn(ADMISSION_SOURCES as unknown as string[])
  source?: string;

  @ApiPropertyOptional({ example: '2026-11-02T10:00:00.000Z', description: 'Entrance test date/time' })
  @IsOptional()
  @Transform(emptyToNull)
  @IsDateString()
  testDate?: string | null;

  @ApiPropertyOptional({ example: 78.5, description: 'Entrance test score (0–999.99)' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === '' || value === null ? null : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  testScore?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdateAdmissionDto extends PartialType(CreateAdmissionDto) {}

export class UpdateStageDto {
  @ApiProperty({ enum: AdmissionStage })
  @IsEnum(AdmissionStage)
  stage: AdmissionStage;

  @ApiPropertyOptional({ description: 'Appended to the enquiry notes' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AdmitEnquiryDto {
  @ApiProperty({ description: 'Section to enrol the student in' })
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ description: 'Auto-generated when empty' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(48)
  admissionNumber?: string;

  @ApiPropertyOptional({ example: '2019-05-20', description: 'Required when the enquiry has no date of birth' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ enum: GENDERS, description: 'Required when the enquiry has no gender' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? (value.trim() === '' ? undefined : value.trim().toUpperCase()) : value))
  @IsIn(GENDERS)
  gender?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  rollNumber?: number;

  @ApiPropertyOptional({ description: "Parent's email for their login (defaults to the enquiry email)" })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(255)
  guardianEmail?: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  academicYearId?: string;
}

// Stored in TenantSettings.themeConfig.admissions (other themeConfig keys are kept).
export class UpdateOnlineFormSettingsDto {
  @ApiProperty({ example: true, description: 'Accept enquiries from the public /apply form' })
  @IsBoolean()
  onlineFormEnabled: boolean;

  @ApiPropertyOptional({ example: 'Admissions open for 2026-27. Our office will call you within 2 working days.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  formMessage?: string;

  @ApiPropertyOptional({ type: [String], example: ['Nursery', 'Class 1'], description: 'Class names offered; empty = all classes' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value))
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  classesOpen?: string[];

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(32)
  academicYearLabel?: string;
}
