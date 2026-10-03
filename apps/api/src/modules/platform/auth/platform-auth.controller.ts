import {
  Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PlatformAuthService, RequestMeta } from "./platform-auth.service";
import { PlatformLoginDto } from "./dto/platform-login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { PlatformJwtAuthGuard } from "./guards/platform-jwt-auth.guard";

type Req_ = {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
  user: { id: string };
};

const metaOf = (req: Req_): RequestMeta => ({
  ip: req.ip,
  userAgent: String(req.headers["user-agent"] ?? ""),
});

@ApiTags("Platform Admin - Auth")
@Controller("platform/auth")
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Super Admin Login" })
  @ApiResponse({ status: 200, description: "Access + refresh token" })
  login(@Body() dto: PlatformLoginDto, @Req() req: Req_) {
    return this.platformAuthService.login(dto, metaOf(req));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.platformAuthService.refresh(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(PlatformJwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  me(@Req() req: Req_) {
    return this.platformAuthService.getMe(req.user.id);
  }

  @Post("logout")
  @UseGuards(PlatformJwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: Req_) {
    return this.platformAuthService.logout(req.user.id, metaOf(req));
  }
}