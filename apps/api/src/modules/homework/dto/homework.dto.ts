import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// 'YYYY-MM-DD' (end of that school day) or a full ISO datetime.
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export class HomeworkListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Assigning teacher' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ enum: ['upcoming', 'past'], description: 'upcoming = due now or later' })
  @IsOptional()
  @IsIn(['upcoming', 'past'])
  status?: 'upcoming' | 'past';
}

export class CreateHomeworkDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 'Chapter 4 exercises' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Solve questions 1-10 from exercise 4.2 in your notebook.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: '2026-10-12', description: "YYYY-MM-DD (end of that school day) or ISO datetime" })
  @IsString()
  @Matches(DUE_DATE_PATTERN, { message: 'Due date must be YYYY-MM-DD or an ISO date-time' })
  dueDate: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  maxMarks?: number | null;

  @ApiPropertyOptional({ description: 'Assigning teacher (admins only; defaults to the current user)' })
  @IsOptional()
  @IsUUID()
  staffId?: string;
}

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {}

export class UpsertSubmissionDto {
  @ApiProperty({ description: 'false removes the submission' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  submitted: boolean;

  @ApiPropertyOptional({ example: 'Submitted in notebook' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string | null;

  @ApiPropertyOptional({ example: 8.5, description: 'Must not exceed max marks; null clears grading' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  marks?: number | null;

  @ApiPropertyOptional({ example: 'Neat work' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string | null;
}

