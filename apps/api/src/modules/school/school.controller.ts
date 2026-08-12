import { Body, Controller, Post } from "@nestjs/common";
import { SchoolService } from "./school.service";
import { CreateSchoolSchema } from "@techrit/types";
import { SkipTenant } from "../../common/decorators/skip-tenant.decorator";

@Controller("schools")
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @SkipTenant()
  @Post("signup")
  async signup(@Body() body: unknown) {
    const input = CreateSchoolSchema.parse(body);
    return this.schoolService.createSchool(input);
  }
}
