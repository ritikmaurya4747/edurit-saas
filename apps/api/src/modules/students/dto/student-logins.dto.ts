import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class IssueLoginDto {
  @ApiPropertyOptional({ example: 'mohan12@gmail.com', description: 'Optional email; students can always sign in with their admission number' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Set this password instead of generating one (min 8). The user must change it at first login.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ default: false, description: 'If a login already exists, issue a new temporary password' })
  @IsOptional()
  @IsBoolean()
  resetExisting?: boolean;
}

export class BulkLoginsDto {
  @ApiProperty({ description: 'Section whose students (current academic year) get logins' })
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeStudents?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeParents?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Also issue new passwords for people who already have a login' })
  @IsOptional()
  @IsBoolean()
  resetExisting?: boolean;
}
