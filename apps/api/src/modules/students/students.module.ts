import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { ParentsController } from './parents.controller';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

// Students, their enrollments (class/section per academic year), guardians and
// parents. StudentsService is exported for admissions (admit from enquiry).
@Module({
  imports: [AcademicModule],
  controllers: [StudentsController, ParentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
