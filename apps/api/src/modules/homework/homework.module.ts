import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';

// Homework assignment, submissions and grading.
@Module({
  imports: [AcademicModule],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
