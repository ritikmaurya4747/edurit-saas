import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";


@Module({
  imports: [JwtModule.register({})],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
