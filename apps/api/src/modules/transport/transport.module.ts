import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { VehiclesService } from './vehicles.service';
import { RoutesService } from './routes.service';
import { AssignmentsService } from './assignments.service';
import { TransportSummaryService } from './transport-summary.service';

// School transport: vehicles, routes with stops and student assignments.
// Fees are informational (route monthlyFee / stop fee) — no invoices are created here.
@Module({
  controllers: [TransportController],
  providers: [VehiclesService, RoutesService, AssignmentsService, TransportSummaryService],
  exports: [TransportSummaryService, AssignmentsService],
})
export class TransportModule {}
