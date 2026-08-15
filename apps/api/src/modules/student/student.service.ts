import { ConflictException, Injectable } from "@nestjs/common";
import { tenantDb } from "@techrit/database";
import type { CreateStudentInput } from "@techrit/types";
import {
  hashPassword,
  generateTempPassword,
} from "../../common/utils/password.util";

@Injectable()
export class StudentService {
  async listStudents(schoolId: string) {
    const db = tenantDb(schoolId);
    return db.studentProfile.findMany({
      where: { schoolId },
      include: {
        user: { select: { fullName: true, email: true, isActive: true } },
        classRoom: true,
      },
    });
  }

  async createStudent(input: CreateStudentInput, schoolId: string) {
    const db = tenantDb(schoolId);

    const existingUser = await db.user.findUnique({
      where: { schoolId_email: { schoolId, email: input.email } },
    });

    if (existingUser) {
      throw new ConflictException(
        "A user with this email already exists in this school",
      );
    }

    const tempPassword = generateTempPassword();

    const createdUser = await db.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        role: "STUDENT",
        passwordHash: hashPassword(tempPassword),
        schoolId,
        studentProfile: {
          create: {
            schoolId,
            rollNumber: input.rollNumber,
            classRoomId: input.classRoomId,
          },
        },
      },
      include: { studentProfile: true },
    });

    // TODO: email tempPassword to the student/parent instead of returning it
    return {
      student: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
      },
      tempPassword,
    };
  }
}
