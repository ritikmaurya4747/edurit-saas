import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { BillingContextService } from './billing-context.service';
import { FeeReportsController } from './fee-reports.controller';
import { FeeReportsService } from './fee-reports.service';
import { FeeStructuresController } from './fee-structures.controller';
import { FeeStructuresService } from './fee-structures.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// Fees & billing: fee structures, student invoices, payments (with receipts
// and allocations), refunds and collection reports. All money maths is done in
// integer paise (see billing.utils.ts).
@Module({
  imports: [AcademicModule],
  controllers: [FeeStructuresController, InvoicesController, PaymentsController, FeeReportsController],
  providers: [BillingContextService, FeeStructuresService, InvoicesService, PaymentsService, FeeReportsService],
  exports: [InvoicesService, PaymentsService, FeeReportsService],
})
export class BillingModule {}
