import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../../core/database/prisma.service";

export interface PlatformJwtPayload {
  sub: string;
  email: string;
  role: string;
  isPlatformUser: boolean;
  type?: "access" | "refresh";
}

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(
  Strategy,
  "platform-jwt",
) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("PLATFORM_JWT_SECRET"),
    });
  }

  async validate(payload: PlatformJwtPayload) {
    if (!payload.isPlatformUser || payload.type !== "access") {
      throw new UnauthorizedException(
        "Access denied. Platform credentials required.",
      );
    }

    const user = await this.prisma.platformUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("Platform account is suspended or invalid.");
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}