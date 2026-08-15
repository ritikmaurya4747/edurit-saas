import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";
import { prisma } from "@techrit/database";
import type { LoginInput, JwtPayload } from "@techrit/types";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const candidateHash = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, candidateHash);
  }

  async login(input: LoginInput, schoolId: string) {
    const user = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email: input.email } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const validPassword = this.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const school = await prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolSubdomain: school.subdomain,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "15m",
    });

    const refreshTokenRaw = randomBytes(40).toString("hex");
    const refreshTokenHash = createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshTokenRaw: string) {
    const tokenHash = createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { school: true } } },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    
    if (!stored.user.isActive || !stored.user.school.isActive) {
      throw new UnauthorizedException("User or School account is deactivated");
    }

    const payload: JwtPayload = {
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      schoolId: stored.user.schoolId,
      schoolSubdomain: stored.user.school.subdomain,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "15m",
    });

    return { accessToken };
  }

  async logout(refreshTokenRaw: string) {
    const tokenHash = createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
    return { success: true };
  }
}
