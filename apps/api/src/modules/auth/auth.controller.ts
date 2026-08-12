import { Body, Controller, Post, Req, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginSchema } from "@techrit/types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async login(@Body() body: unknown, @Req() req: any) {
    const input = LoginSchema.parse(body);

    if (!req.tenantSchool) {
      throw new UnauthorizedException("School context missing");
    }

    return this.authService.login(input, req.tenantSchool.id);
  }

  @Post("refresh")
  async refresh(@Body("refreshToken") refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post("logout")
  async logout(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
