import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
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
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'Date must be in YYYY-MM-DD format';
const toBoolean = ({ value }: { value: unknown }) => value === 'true' || value === true;
const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const ISSUE_STATUSES = ['issued', 'overdue', 'returned'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const BORROWER_TYPES = ['student', 'staff'] as const;
export type BorrowerType = (typeof BORROWER_TYPES)[number];

// ---------- Books ----------
export class CreateBookDto {
  @ApiProperty({ example: 'Wings of Fire' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'A. P. J. Abdul Kalam' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(255)
  author?: string;

  @ApiPropertyOptional({ example: '9788173711466' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(32)
  @Matches(/^[0-9Xx -]+$/, { message: 'ISBN may contain digits, X, spaces and -' })
  isbn?: string;

  @ApiPropertyOptional({ example: 'Universities Press' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(255)
  publisher?: string;

  @ApiPropertyOptional({ example: 'Biography' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ example: 'A-3' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(32)
  shelfLocation?: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  totalCopies: number;
}

// Optional text fields accept null to clear them.
export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Wings of Fire' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  author?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[0-9Xx -]*$/, { message: 'ISBN may contain digits, X, spaces and -' })
  isbn?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  publisher?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  shelfLocation?: string | null;

  @ApiPropertyOptional({ example: 6, description: 'Changes available copies by the same amount' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  totalCopies?: number;
}

export class BookListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Fiction' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ description: 'Only titles with at least one copy on the shelf' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  available?: boolean;
}

// ---------- Issues ----------
export class IssueListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ISSUE_STATUSES, description: 'issued = not yet returned (incl. overdue)' })
  @IsOptional()
  @IsIn(ISSUE_STATUSES)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: BORROWER_TYPES })
  @IsOptional()
  @IsIn(BORROWER_TYPES)
  borrowerType?: BorrowerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bookId?: string;
}

export class CreateIssueDto {
  @ApiProperty()
  @IsUUID()
  bookId: string;

  @ApiPropertyOptional({ description: 'Borrowing student (give exactly one of studentId / staffId)' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Borrowing staff member (give exactly one of studentId / staffId)' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ example: '2026-10-23', description: 'Defaults to today + 14 days' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class ReturnIssueDto {
  @ApiPropertyOptional({ example: '2026-10-20T10:30:00.000Z', description: 'Defaults to now' })
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @ApiPropertyOptional({ example: 10, description: 'Defaults to the computed late fine' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  fineAmount?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  finePaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class RenewIssueDto {
  @ApiProperty({ example: '2026-11-06' })
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  dueDate: string;
}
