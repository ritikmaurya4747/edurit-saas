import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

// Weekly section timetables, teacher schedules and clash detection.
@Module({
  imports: [AcademicModule],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
