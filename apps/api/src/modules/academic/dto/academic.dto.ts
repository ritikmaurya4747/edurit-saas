import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// ---------- Academic years ----------
export class CreateAcademicYearDto {
  @ApiProperty({ example: '2026-27' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-03-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {}

// ---------- Branches ----------
export class CreateBranchDto {
  @ApiProperty({ example: 'North Campus' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'NORTH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Code may contain letters, numbers, - and _' })
  code: string;

  @ApiPropertyOptional({ example: { line1: '12 MG Road', city: 'Pune', state: 'MH', pincode: '411001' } })
  @IsOptional()
  @IsObject()
  address?: Record<string, string>;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

// ---------- Classes & sections ----------
export class CreateClassDto {
  @ApiProperty({ example: 'Class 8' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: 'C8' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;

  @ApiPropertyOptional({ description: 'Defaults to the first branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: ['A', 'B'], description: 'Sections to create with the class' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(26)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  sections?: string[];

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  sectionCapacity?: number;
}

export class UpdateClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code?: string;
}

export class CreateSectionDto {
  @ApiProperty({ example: 'C' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number;
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}

// ---------- Subjects ----------
export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'MATH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export class ClassListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
