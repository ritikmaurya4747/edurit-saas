import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../core/database/prisma.service";
import { PlatformLoginDto } from "./dto/platform-login.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: PlatformLoginDto) {
    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Check if the account is locked due to multiple failed login attempts
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        "Account temporarily locked. Try again later.",
      );
    }

    // security measure to prevent brute-force attacks by locking the account after multiple failed attempts
    if (user?.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.platformUser.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
    }

    // Use a dummy hash to prevent timing attacks when the user is not found
    const DUMMY_HASH =
      "$2b$10$CwTycUXWue0Thq9StjUM0uJ8O8JZ7l4v9M2K3S8mVjEXAMPLEHASH";
    const passwordHash = user?.passwordHash ?? DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !user.isActive || user.deletedAt || !isPasswordValid) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        await this.prisma.platformUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil:
              attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          },
        });
      }
      throw new UnauthorizedException("Invalid platform credentials");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isPlatformUser: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: "1h",
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: "refresh" },
      { expiresIn: "30d" },
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.platformUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}