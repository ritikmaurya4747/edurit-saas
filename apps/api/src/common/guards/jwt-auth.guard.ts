import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayloadSchema } from "@techrit/types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers["authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing access token");
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const payload = JwtPayloadSchema.parse(decoded);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
