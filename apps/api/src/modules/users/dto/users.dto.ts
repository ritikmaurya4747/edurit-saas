import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// ---------- Roles ----------
export class CreateRoleDto {
  @ApiProperty({ example: 'Librarian' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({
    example: 'LIBRARIAN',
    description: 'Unique per school. Derived from the name (UPPER_SNAKE) when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'Role code may contain only letters, numbers and _' })
  code?: string;

  @ApiProperty({ example: ['students:read', 'notices:read'], type: [String] })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  permissionCodes: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Senior Librarian', description: 'System role names cannot be changed' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    example: ['students:read'],
    type: [String],
    description: 'Replaces the full permission set. Not allowed for the ADMIN role.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  permissionCodes?: string[];
}

// ---------- Members ----------
export const MEMBER_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED'] as const;

export class ListMembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'TEACHER', description: 'Only members holding this role' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleCode?: string;

  @ApiPropertyOptional({ enum: MEMBER_STATUSES })
  @IsOptional()
  @IsIn(MEMBER_STATUSES as unknown as string[])
  status?: (typeof MEMBER_STATUSES)[number];
}

export class SetMemberRolesDto {
  @ApiProperty({ example: ['TEACHER'], type: [String], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one role' })
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsString({ each: true })
  roleCodes: string[];
}

export class SetMemberStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}

// ---------- Audit logs ----------
export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Student' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityName?: string;

  @ApiPropertyOptional({ description: 'User who performed the action' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'UPDATE' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'From date (inclusive, school timezone)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-04-30', description: 'To date (inclusive, school timezone)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
