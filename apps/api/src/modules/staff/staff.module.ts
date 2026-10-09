import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffLeavesController } from './staff-leaves.controller';
import { StaffLeavesService } from './staff-leaves.service';
import { StaffAttendanceController } from './staff-attendance.controller';
import { StaffAttendanceService } from './staff-attendance.service';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { StaffAppraisalsController } from './staff-appraisals.controller';
import { StaffAppraisalsService } from './staff-appraisals.service';

// Staff & HR: directory + login accounts, leaves, staff attendance, payroll and appraisals.
@Module({
  imports: [AcademicModule],
  controllers: [StaffController, StaffLeavesController, StaffAttendanceController, PayrollController, StaffAppraisalsController],
  providers: [StaffService, StaffLeavesService, StaffAttendanceService, PayrollService, StaffAppraisalsService],
  exports: [StaffService, StaffAttendanceService],
})
export class StaffModule {}
