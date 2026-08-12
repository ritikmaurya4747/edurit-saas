import { CreateSchoolInput } from '@techrit/types';
import { BadRequestException, Injectable } from "@nestjs/common";
import { prisma } from "@techrit/database";
import { randomBytes, scryptSync } from "crypto";

@Injectable()
export class SchoolService {
  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  async createSchool(input: CreateSchoolInput) {
    const existing = await prisma.school.findUnique({ where: { subdomain: input.subdomain } });
    if (existing) {
      throw new BadRequestException(`Subdomain '${input.subdomain}' is already taken`);
    }

    const tempPassword = randomBytes(6).toString("hex");

    const school = await prisma.school.create({
      data: {
        name: input.name,
        subdomain: input.subdomain,
        phone: input.phone,
        plan: "TRIAL",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        users: {
          create: {
            email: input.principalEmail,
            fullName: input.principalName,
            role: "SUPERADMIN",
            passwordHash: this.hashPassword(tempPassword),
          },
        },
      },
      include: { users: true },
    });

    return {
      school: { id: school.id, subdomain: school.subdomain, name: school.name },
      tempPassword,
    };
  }
}
