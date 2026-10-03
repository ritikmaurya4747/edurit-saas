import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class PlatformLoginDto {
  @ApiProperty({ example: "admin@example.com", format: "email" })
  @IsEmail({}, { message: "Invalid email address" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "********" })
  @IsString()
  @IsNotEmpty()
  password: string;
}