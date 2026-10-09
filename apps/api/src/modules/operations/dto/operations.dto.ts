import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'Date must be in YYYY-MM-DD format';
const toBoolean = ({ value }: { value: unknown }) => value === 'true' || value === true;

// ---------- Visitors ----------
export class CreateVisitorDto {
  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone: string;

  @ApiProperty({ example: 'Meeting with class teacher of 8-B' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  purpose: string;
}

export class VisitorListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-10-09', description: 'Check-in day (school timezone)' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  date?: string;

  @ApiPropertyOptional({ description: 'Only visitors who have not checked out' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;
}

// ---------- Infirmary ----------
export class CreateInfirmaryVisitDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'Headache and mild fever' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  complaint: string;

  @ApiProperty({ example: 'Paracetamol 250mg, rested 30 minutes, parent informed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  treatment: string;

  @ApiPropertyOptional({ example: '2026-10-09T10:30:00+05:30', description: 'Defaults to now' })
  @IsOptional()
  @IsDateString()
  visitedAt?: string;
}

export class InfirmaryListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'From day (inclusive, school timezone)' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'To day (inclusive, school timezone)' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  to?: string;
}

// ---------- Inventory ----------
export class CreateInventoryItemDto {
  @ApiProperty({ example: 'STN-A4-500' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(48)
  @Matches(/^[A-Za-z0-9._/-]+$/, { message: 'SKU may contain letters, numbers, ., /, - and _' })
  sku: string;

  @ApiProperty({ example: 'A4 paper ream (500 sheets)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({ example: 20, default: 0, description: 'Opening stock' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  quantity?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  reorderLevel?: number;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(48)
  @Matches(/^[A-Za-z0-9._/-]+$/, { message: 'SKU may contain letters, numbers, ., /, - and _' })
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  reorderLevel?: number;
}

export class AdjustStockDto {
  @ApiProperty({ example: -3, description: 'Positive to add stock, negative to remove' })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0, { message: 'Adjustment cannot be zero' })
  @Min(-10_000_000)
  @Max(10_000_000)
  delta: number;

  @ApiProperty({ example: 'Issued to science lab' })
  @IsString()
  @IsNotEmpty({ message: 'Please give a reason for the adjustment' })
  @MaxLength(255)
  reason: string;
}

export class InventoryListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only items at or below their reorder level' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  lowStock?: boolean;
}

// ---------- Compliance ----------
export const COMPLIANCE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLIANT', 'OVERDUE', 'EXPIRED'] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export class CreateComplianceDto {
  @ApiProperty({ example: 'Fire NOC renewal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'FIRE_SAFETY',
    description: 'Free text, e.g. FIRE_SAFETY, BUILDING, AFFILIATION, TRANSPORT, HEALTH, POLICE_VERIFICATION, OTHER',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  complianceType: string;

  @ApiProperty({ example: '2026-12-31' })
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  dueDate: string;

  @ApiPropertyOptional({ example: 'https://drive.example.com/fire-noc.pdf', nullable: true })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Document link must be a full URL starting with http:// or https://' })
  @MaxLength(2048)
  documentUrl?: string | null;

  @ApiPropertyOptional({ enum: COMPLIANCE_STATUSES, default: 'PENDING' })
  @IsOptional()
  @IsIn(COMPLIANCE_STATUSES, { message: `Status must be one of ${COMPLIANCE_STATUSES.join(', ')}` })
  status?: ComplianceStatus;
}

export class UpdateComplianceDto extends PartialType(CreateComplianceDto) {}

export class ComplianceListQueryDto {
  @ApiPropertyOptional({ enum: COMPLIANCE_STATUSES })
  @IsOptional()
  @IsIn(COMPLIANCE_STATUSES)
  status?: ComplianceStatus;

  @ApiPropertyOptional({ example: 'FIRE_SAFETY' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  complianceType?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Only non-compliant records due within N days from today (overdue records included)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  dueWithinDays?: number;

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;
}
