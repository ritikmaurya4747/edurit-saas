import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { PublicModule } from '../public/public.module';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';

// Admission enquiries pipeline (enquiry → documents → test → offer → admitted).
// Admitting delegates to StudentsService.create.
// PublicModule (the unauthenticated online admission form that feeds this
// pipeline) is registered through here so app.module.ts stays untouched.
@Module({
  imports: [StudentsModule, PublicModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
})
export class AdmissionsModule {}
