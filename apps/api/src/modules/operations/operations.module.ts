import { Module } from '@nestjs/common';
import {
  ComplianceController,
  InfirmaryController,
  InventoryController,
  OperationsSummaryController,
  VisitorsController,
} from './operations.controller';
import { VisitorsService } from './visitors.service';
import { InfirmaryService } from './infirmary.service';
import { InventoryService } from './inventory.service';
import { ComplianceService } from './compliance.service';
import { OperationsSummaryService } from './operations-summary.service';

// Front office: visitor register, infirmary log, inventory and compliance tracking.
@Module({
  controllers: [
    OperationsSummaryController,
    VisitorsController,
    InfirmaryController,
    InventoryController,
    ComplianceController,
  ],
  providers: [VisitorsService, InfirmaryService, InventoryService, ComplianceService, OperationsSummaryService],
  exports: [OperationsSummaryService],
})
export class OperationsModule {}
