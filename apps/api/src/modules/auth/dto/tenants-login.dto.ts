import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class TenantsLoginDto {
  // Kept as `email` for backwards compatibility; it accepts any login id.
  @ApiProperty({
    example: 'admin@school.com',
    description: 'Email, registered mobile number (parents/staff) or admission number (students)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
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
