import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}