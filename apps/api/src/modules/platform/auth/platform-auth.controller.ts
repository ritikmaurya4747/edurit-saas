import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PlatformAuthService } from "./platform-auth.service";
import { PlatformLoginDto } from "./dto/platform-login.dto";

@ApiTags("Platform Admin - Auth")
@Controller("platform/auth")
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @ApiOperation({ summary: "Super Admin Login" })
  @ApiResponse({ status: 200, description: "JWT Access token generated" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PlatformLoginDto) {
    return this.platformAuthService.login(dto);
  }
}