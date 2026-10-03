import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createHash, timingSafeEqual } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../core/database/prisma.service";
import { PlatformLoginDto } from "./dto/platform-login.dto";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

// Real bcrypt hash, startup pe ek baar (timing attack se bachav)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-timing", 12);
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

@Injectable()
export class PlatformAuthService {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Audit fail ho to login/logout nahi tootna chahiye
  private async audit(
    userId: string,
    action: string,
    meta?: RequestMeta,
    changes: Record<string, string | number | boolean> = {},
  ) {
    try {
      await this.prisma.platformAuditLog.create({
        data: {
          platformUserId: userId,
          action,
          entityName: "PlatformUser",
          entityId: userId,
          changes,
          ipAddress: meta?.ip?.slice(0, 45),
          userAgent: meta?.userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed (${action}): ${(err as Error).message}`);
    }
  }

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        isPlatformUser: true,
        type: "access",
      },
      { expiresIn: "1h" },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, isPlatformUser: true, type: "refresh" },
      {
        secret: this.config.getOrThrow<string>("PLATFORM_REFRESH_SECRET"),
        expiresIn: "30d",
      },
    );

    await this.prisma.platformUser.update({
      where: { id: user.id },
      data: { refreshTokenHash: sha256(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  async login(dto: PlatformLoginDto, meta?: RequestMeta) {
    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        "Account temporarily locked. Try again later.",
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.isActive || user.deletedAt || !isPasswordValid) {
      if (user) {
        const { failedLoginAttempts } = await this.prisma.platformUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
          select: { failedLoginAttempts: true },
        });

        await this.audit(user.id, "LOGIN_FAILED", meta, {
          attempts: failedLoginAttempts,
        });

        if (failedLoginAttempts >= MAX_ATTEMPTS) {
          await this.prisma.platformUser.update({
            where: { id: user.id },
            data: {
              lockedUntil: new Date(Date.now() + LOCK_MS),
              failedLoginAttempts: 0,
            },
          });
          await this.audit(user.id, "ACCOUNT_LOCKED", meta);
        }
      }
      throw new UnauthorizedException("Invalid platform credentials");
    }

    const tokens = await this.issueTokens(user);

    await this.prisma.platformUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.audit(user.id, "LOGIN_SUCCESS", meta);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>("PLATFORM_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.type !== "refresh") throw new UnauthorizedException();

    const user = await this.prisma.platformUser.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive || user.deletedAt || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    const a = Buffer.from(sha256(refreshToken));
    const b = Buffer.from(user.refreshTokenHash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }

    // rotation: purana refresh token ab invalid
    return this.issueTokens(user);
  }

  async logout(userId: string, meta?: RequestMeta) {
    await this.prisma.platformUser.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    await this.audit(userId, "LOGOUT", meta);
  }

  async getMe(userId: string) {
    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
    };
  }
}