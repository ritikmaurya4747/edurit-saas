import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CreateTeacherSchema } from "@techrit/types";
import type { CreateTeacherInput, JwtPayload } from "@techrit/types";
import { TeacherService } from "./teacher.service";
import { ZodValidationPipe } from "src/common/pipes/zod-validation.pipe";

@Controller("teachers")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  @Roles("SUPERADMIN")
  @Get()
  async listTeachers(@CurrentUser() user: JwtPayload) {
    return this.teacherService.listTeachers(user.schoolId);
  }

  @Roles("SUPERADMIN")
  @Post()
  async createTeacher(
    @Body(new ZodValidationPipe(CreateTeacherSchema)) input: CreateTeacherInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.teacherService.createTeacher(input, user.schoolId);
  }
}
