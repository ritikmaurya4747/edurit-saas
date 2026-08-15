import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CreateStudentSchema } from "@techrit/types";
import type { CreateStudentInput, JwtPayload } from "@techrit/types";
import { StudentService } from "./student.service";
import { ZodValidationPipe } from "src/common/pipes/zod-validation.pipe";

@Controller("students")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Roles("SUPERADMIN", "TEACHER")
  @Get()
  async listStudents(@CurrentUser() user: JwtPayload) {
    return this.studentService.listStudents(user.schoolId);
  }

  @Roles("SUPERADMIN")
  @Post()
  async createStudent(
    @Body(new ZodValidationPipe(CreateStudentSchema)) input: CreateStudentInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentService.createStudent(input, user.schoolId);
  }
}
