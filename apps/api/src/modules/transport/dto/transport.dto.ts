import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'Date must be in YYYY-MM-DD format';
const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = 'Time must be in HH:mm (24-hour) format';
const toBoolean = ({ value }: { value: unknown }) => value === 'true' || value === true;
// Trim strings and turn blank optional values into undefined.
const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

// ---------- Vehicles ----------
export class CreateVehicleDto {
  @ApiProperty({ example: 'KA01AB1234', description: 'Stored in upper case; unique per school' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9 -]+$/, { message: 'Registration number may contain letters, numbers, spaces and -' })
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'Tata Starbus 40' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(128)
  model?: string;

  @ApiProperty({ example: 40, description: 'Seats available for students' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  capacity: number;

  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  driverName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  driverPhone: string;

  @ApiPropertyOptional({ example: 'KA0120110012345' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(64)
  driverLicense?: string;

  @ApiPropertyOptional({ example: 'Suresh' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(128)
  helperName?: string;

  @ApiPropertyOptional({ example: '+91 98765 00000' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(32)
  helperPhone?: string;

  @ApiPropertyOptional({ example: '2027-03-31', description: 'Insurance valid until (YYYY-MM-DD)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Fitness certificate valid until (YYYY-MM-DD)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  fitnessExpiry?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

// ---------- Routes & stops ----------
export class RouteStopInputDto {
  @ApiPropertyOptional({ description: 'Existing stop id (keep it so student assignments survive)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'MG Road Metro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({ example: '07:10', description: 'Morning pickup time (HH:mm)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(TIME_HHMM, { message: TIME_MESSAGE })
  pickupTime?: string;

  @ApiPropertyOptional({ example: '14:40', description: 'Afternoon drop time (HH:mm)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(TIME_HHMM, { message: TIME_MESSAGE })
  dropTime?: string;

  @ApiPropertyOptional({ example: 1200, description: 'Monthly fee for this stop (overrides route fee)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee?: number;
}

export class CreateRouteDto {
  @ApiProperty({ example: 'Whitefield - School' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'R1', description: 'Short code, unique per school (stored in upper case)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Code may contain letters, numbers, - and _' })
  code: string;

  @ApiPropertyOptional({ description: 'Vehicle serving this route' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ example: 1500, description: 'Transport fee per month' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyFee: number;

  @ApiPropertyOptional({ type: [RouteStopInputDto], description: 'Stops in travel order (sequence = array order)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  stops?: RouteStopInputDto[];
}

export class UpdateRouteDto {
  @ApiPropertyOptional({ example: 'Whitefield - School' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ example: 'R1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Code may contain letters, numbers, - and _' })
  code?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Vehicle id, or null to unassign the vehicle' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string | null;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReplaceStopsDto {
  @ApiProperty({ type: [RouteStopInputDto], description: 'Full stop list in travel order; omitted stops are deleted' })
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  stops: RouteStopInputDto[];
}

export class RouteListQueryDto {
  @ApiPropertyOptional({ description: 'Include routes marked inactive' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInactive?: boolean;
}

// ---------- Assignments ----------
export class AssignmentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ description: 'Current-year section of the student' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Also list ended assignments' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  routeId: string;

  @ApiPropertyOptional({ description: 'Boarding stop on the route' })
  @IsOptional()
  @IsUUID()
  stopId?: string;

  @ApiPropertyOptional({ example: '2026-10-09', description: 'Defaults to today (school timezone)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  startDate?: string;
}

export class EndAssignmentDto {
  @ApiPropertyOptional({ example: '2026-10-31', description: 'Defaults to today (school timezone)' })
  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  endDate?: string;
}

