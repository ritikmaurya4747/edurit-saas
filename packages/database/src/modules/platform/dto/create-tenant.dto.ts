import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    example: 'dps-rk-puram',
    description: 'Unique URL slug for school portal subdomain',
    maxLength: 63,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    example: 'Delhi Public School, R.K. Puram',
    description: 'Display name of the school / organization',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'DPS Educational Society Reg. 1972',
    description: 'Legal registered business entity name',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({
    example: 'principal@dpsrkpuram.com',
    description: 'Initial school admin email address for login credentials',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    example: 'Amitabh',
    description: 'Admin first name',
  })
  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @ApiProperty({
    example: 'Verma',
    description: 'Admin last name',
  })
  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @ApiPropertyOptional({
    example: 'INR',
    description: '3-letter ISO currency code',
    default: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({
    example: 'Asia/Kolkata',
    description: 'IANA timezone for timetable and attendance sessions',
    default: 'Asia/Kolkata',
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Kolkata';
}