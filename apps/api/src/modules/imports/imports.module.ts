import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { StudentsModule } from '../students/students.module';
import { StaffModule } from '../staff/staff.module';
import { ImportsController } from './imports.controller';
import { StudentImportService } from './student-import.service';
import { StaffImportService } from './staff-import.service';

// Excel / CSV bulk onboarding of students (with parents & logins) and staff.
// Reuses StudentsService / StaffService so imported records follow exactly
// the same rules as the admission and staff forms.
@Module({
  imports: [AcademicModule, StudentsModule, StaffModule],
  controllers: [ImportsController],
  providers: [StudentImportService, StaffImportService],
})
export class ImportsModule {}
