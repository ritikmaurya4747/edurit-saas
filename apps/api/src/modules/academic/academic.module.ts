import { Module } from '@nestjs/common';
import { AcademicYearsController } from './academic-years.controller';
import { AcademicYearsService } from './academic-years.service';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

// Academic structure: years, branches, classes/sections and subjects.
// AcademicYearsService.requireCurrent() and BranchesService.resolveBranchId()
// are exported for other modules.
@Module({
  controllers: [AcademicYearsController, BranchesController, ClassesController, SubjectsController],
  providers: [AcademicYearsService, BranchesService, ClassesService, SubjectsService],
  exports: [AcademicYearsService, BranchesService, ClassesService, SubjectsService],
})
export class AcademicModule {}
