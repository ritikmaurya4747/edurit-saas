import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ---------- Exams ----------
export class ExamListQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class CreateExamDto {
  @ApiProperty({ example: 'Half Yearly Examination' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-28' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Half Yearly Examination' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-28' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class PublishExamDto {
  @ApiProperty({ description: 'true = publish results, false = back to draft' })
  @IsBoolean()
  isPublished: boolean;
}

// ---------- Exam schedule ----------
export class CreateExamSubjectDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: '2026-09-16' })
  @IsDateString()
  examDate: string;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999)
  maxMarks?: number;

  @ApiPropertyOptional({ example: 33, default: 33 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  passingMarks?: number;

  @ApiPropertyOptional({ description: 'Link to the question paper PDF' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  paperPdfUrl?: string;
}

export class UpdateExamSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999)
  maxMarks?: number;

  @ApiPropertyOptional({ example: 33 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  passingMarks?: number;

  @ApiPropertyOptional({ description: 'Link to the question paper PDF (null clears it)', nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  paperPdfUrl?: string | null;
}

// ---------- Marks & results ----------
export class SectionQueryDto {
  @ApiProperty({ description: 'Section to load' })
  @IsUUID()
  sectionId: string;
}

export class MarkEntryDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 78.5, nullable: true, description: 'null = absent / not entered (removes an existing mark)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  marksObtained: number | null;

  @ApiPropertyOptional({ example: 'Good improvement' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class SaveMarksDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ type: [MarkEntryDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  marks: MarkEntryDto[];
}

// ---------- Report cards ----------
export class GenerateReportCardsDto {
  @ApiPropertyOptional({ description: 'Only this section (default: every section with marks)' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class ReportCardListQueryDto {
  @ApiProperty()
  @IsUUID()
  examId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class ReportCardStudentQueryDto {
  @ApiProperty()
  @IsUUID()
  examId: string;
}

export class UpdateReportCardDto {
  @ApiProperty({ example: 'A sincere and hardworking student.', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks: string | null;
}

// ---------- Seating / desk slips ----------
export const SEAT_STATUSES = ['GENERATED', 'PRINTED', 'ASSIGNED'] as const;

export class SeatingRoomDto {
  @ApiProperty({ example: 'Room 101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  roomNumber: string;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(260)
  capacity: number;
}

export class GenerateSeatingDto {
  @ApiProperty({ type: [String], description: 'Sections whose students get seats' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  sectionIds: string[];

  @ApiProperty({ type: [SeatingRoomDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SeatingRoomDto)
  rooms: SeatingRoomDto[];

  @ApiPropertyOptional({ default: true, description: 'Alternate sections seat by seat to reduce copying' })
  @IsOptional()
  @IsBoolean()
  interleave?: boolean;
}

export class SeatingQueryDto {
  @ApiPropertyOptional({ example: 'Room 101' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  roomNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class UpdateExamSeatDto {
  @ApiPropertyOptional({ example: 'Room 102' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'B-04' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  seatNumber?: string;

  @ApiPropertyOptional({ enum: SEAT_STATUSES })
  @IsOptional()
  @IsIn(SEAT_STATUSES)
  status?: (typeof SEAT_STATUSES)[number];
}

export class MarkPrintedDto {
  @ApiPropertyOptional({ type: [String], description: 'Seats to mark printed (default: every seat of the exam)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID('all', { each: true })
  seatIds?: string[];
}
