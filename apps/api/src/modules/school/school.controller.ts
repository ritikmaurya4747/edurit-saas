import { Body, Controller, Post } from "@nestjs/common";
import { SchoolService } from "./school.service";
import { CreateSchoolSchema } from "@techrit/types";

@Controller("schools")
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post("signup")
  async signup(@Body() body: unknown) {
    const input = CreateSchoolSchema.parse(body);
    return this.schoolService.createSchool(input);
  }
}
