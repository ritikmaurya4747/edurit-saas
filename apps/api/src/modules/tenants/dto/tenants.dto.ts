import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Stored in TenantSettings.themeConfig.profile. Every field is optional; an
// empty string clears the value.
export class SchoolProfileDto {
  @ApiPropertyOptional({ example: '12 MG Road' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Pune' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  state?: string;

  @ApiPropertyOptional({ example: '411001' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(16)
  pincode?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'office@school.edu.in' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  @Matches(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Enter a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'https://school.edu.in' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: 'CBSE' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  affiliationBoard?: string;

  @ApiPropertyOptional({ example: '1130001' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  affiliationNumber?: string;

  @ApiPropertyOptional({ example: 'Dr. A. Sharma' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  principalName?: string;

  @ApiPropertyOptional({ example: '1998' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(8)
  establishedYear?: string;
}

export const PROFILE_FIELDS = [
  'address',
  'city',
  'state',
  'pincode',
  'phone',
  'email',
  'website',
  'affiliationBoard',
  'affiliationNumber',
  'principalName',
  'establishedYear',
] as const;

export class UpdateSchoolSettingsDto {
  @ApiPropertyOptional({ example: 'Green Valley Public School' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'School name cannot be empty' })
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Green Valley Education Trust', description: 'Empty string clears it' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ example: 'INR', description: 'ISO 4217 code' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter code such as INR' })
  currency?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata', description: 'IANA timezone' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png', description: 'Empty string removes the logo' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @ValidateIf((o: UpdateSchoolSettingsDto) => !!o.logoUrl)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'Logo URL must be an http(s) link' })
  @MaxLength(2048)
  logoUrl?: string;

  @ApiPropertyOptional({ type: SchoolProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchoolProfileDto)
  profile?: SchoolProfileDto;
}
