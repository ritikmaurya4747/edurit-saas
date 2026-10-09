import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

// Academic calendar: holidays, school events and PTMs (role-targeted), merged
// with scheduled exams. CalendarService.holidays() is exported for other modules.
@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
