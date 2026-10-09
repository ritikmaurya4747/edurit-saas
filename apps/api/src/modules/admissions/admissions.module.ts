import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';

// Admission enquiries pipeline (enquiry → documents → test → offer → admitted).
// Admitting delegates to StudentsService.create.
@Module({
  imports: [StudentsModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
})
export class AdmissionsModule {}
