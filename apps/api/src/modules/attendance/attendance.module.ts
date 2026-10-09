import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { StudentLeavesController } from './student-leaves.controller';
import { StudentLeavesService } from './student-leaves.service';

// Daily/period attendance marking, analytics (summary, trend, register) and
// student leave requests.
@Module({
  imports: [AcademicModule],
  controllers: [AttendanceController, StudentLeavesController],
  providers: [AttendanceService, StudentLeavesService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
