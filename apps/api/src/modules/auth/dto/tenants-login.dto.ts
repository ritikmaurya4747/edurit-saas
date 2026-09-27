import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TenantsLoginDto {
  @ApiProperty({ example: 'admin@school.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'dps-rk-puram', description: 'Extracted from subdomain URL' })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;
}