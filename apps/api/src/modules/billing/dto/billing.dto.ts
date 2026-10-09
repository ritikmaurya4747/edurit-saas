import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { InvoiceStatus } from '@edurit/database';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Largest value a DECIMAL(12,2) column can hold.
const MAX_AMOUNT = 9_999_999_999.99;
const money = { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false };

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const toBool = ({ value }: { value: unknown }) => value === 'true' || value === true;

// ---------- Fee structures ----------
export class FeeComponentInputDto {
  @ApiPropertyOptional({ description: 'Existing component id (keeps invoice links when editing)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 45000, description: 'Annual amount' })
  @Type(() => Number)
  @IsNumber(money)
  @Min(0.01)
  @Max(MAX_AMOUNT)
  amount: number;
}

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'Class 8 - 2026-27' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiProperty({ type: [FeeComponentInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one fee component' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FeeComponentInputDto)
  components: FeeComponentInputDto[];
}

export class UpdateFeeStructureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ type: [FeeComponentInputDto], description: 'Replaces the full component list' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one fee component' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FeeComponentInputDto)
  components?: FeeComponentInputDto[];
}

export class FeeStructureQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

// ---------- Invoices ----------
export class InvoiceItemInputDto {
  @ApiProperty({ example: 'Tuition Fee - Term 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title: string;

  @ApiProperty({ example: 15000 })
  @Type(() => Number)
  @IsNumber(money)
  @Min(0)
  @Max(MAX_AMOUNT)
  unitAmount: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(money)
  @Min(0)
  @Max(MAX_AMOUNT)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Fee component this line comes from' })
  @IsOptional()
  @IsUUID()
  feeComponentId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '2026-10-31' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiProperty({ type: [InvoiceItemInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one invoice item' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items: InvoiceItemInputDto[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(money)
  @Min(0)
  @Max(MAX_AMOUNT)
  taxTotal?: number;
}

export class BulkInvoiceDto {
  @ApiProperty()
  @IsUUID()
  feeStructureId: string;

  @ApiPropertyOptional({ description: 'Bill every section of this class (classId or sectionId is required)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Bill one section (classId or sectionId is required)' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiProperty({ example: '2026-10-31', description: 'Due date of the first installment' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 10, description: 'Discount applied to every component (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(money)
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Split into N monthly invoices (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  installments?: number;
}

export class VoidInvoiceDto {
  @ApiProperty({ example: 'Issued twice by mistake' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class InvoiceListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsIn(Object.values(InvoiceStatus))
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Current-year class of the student' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Current-year section of the student' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Only overdue invoices (balance > 0, past due, not void)' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

// ---------- Payments & refunds ----------
export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber(money)
  @Min(0.01, { message: 'Amount must be greater than zero' })
  @Max(MAX_AMOUNT)
  amount: number;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS as unknown as string[])
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Client generated UUID; repeating it returns the original payment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  idempotencyKey: string;

  @ApiPropertyOptional({ description: 'UPI ref / cheque no / transaction id' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  gatewayRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({ example: '2026-10-09', description: 'Date (YYYY-MM-DD) or ISO timestamp; defaults to now' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ type: [String], description: 'Invoices to settle; defaults to all open invoices, oldest due first' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  invoiceIds?: string[];
}

export class PaymentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PAYMENT_METHODS })
  @IsOptional()
  @IsIn(PAYMENT_METHODS as unknown as string[])
  method?: PaymentMethod;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateRefundDto {
  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber(money)
  @Min(0.01, { message: 'Refund amount must be greater than zero' })
  @Max(MAX_AMOUNT)
  amount: number;

  @ApiProperty({ example: 'Student withdrew from transport' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

export class RefundListQueryDto extends PaginationQueryDto {}

// ---------- Reports ----------
export class FeeSummaryQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to the current academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class DefaultersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}
