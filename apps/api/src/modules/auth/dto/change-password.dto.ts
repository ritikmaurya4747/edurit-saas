import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
