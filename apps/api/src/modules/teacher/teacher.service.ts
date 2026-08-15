import { Injectable } from "@nestjs/common";
import { tenantDb } from "@techrit/database";
import type { CreateTeacherInput } from "@techrit/types";
import { hashPassword, generateTempPassword } from "../../common/utils/password.util";

@Injectable()
export class TeacherService {
  async listTeachers(schoolId: string) {
    const db = tenantDb(schoolId);
    return db.teacherProfile.findMany({
      where: { schoolId },
      include: {
        user: { select: { fullName: true, email: true, isActive: true } },
      },
    });
  }

  async createTeacher(input: CreateTeacherInput, schoolId: string) {
    const db = tenantDb(schoolId);
    const tempPassword = generateTempPassword();

    const createdUser = await db.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        role: "TEACHER",
        passwordHash: hashPassword(tempPassword),
        schoolId,
        teacherProfile: {
          create: {
            schoolId,
            subject: input.subject,
          },
        },
      },
      include: { teacherProfile: true },
    });

    // TODO: email tempPassword to the teacher instead of returning it
    return {
      teacher: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
      },
      tempPassword,
    };
  }
}
