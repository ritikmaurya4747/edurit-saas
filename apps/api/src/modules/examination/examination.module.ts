import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { MarksService } from './marks.service';
import { ReportCardsController } from './report-cards.controller';
import { ReportCardsService } from './report-cards.service';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';

// Exams, schedule, marks entry, results, report cards and exam seating.
// The grade scale lives in ./grading (gradeFor) and is reused everywhere.
@Module({
  imports: [AcademicModule],
  controllers: [ExamsController, ReportCardsController, SeatingController],
  providers: [ExamsService, MarksService, ReportCardsService, SeatingService],
  exports: [ExamsService, MarksService],
})
export class ExaminationModule {}
