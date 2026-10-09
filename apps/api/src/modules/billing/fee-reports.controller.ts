import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { FeeReportsService } from './fee-reports.service';
import { DefaultersQueryDto, FeeSummaryQueryDto } from './dto/billing.dto';

@ApiTags('Billing - Reports')
@TenantAuth(PERMISSIONS.INVOICE_READ)
@Controller({ path: 'fees', version: '1' })
export class FeeReportsController {
  constructor(private readonly service: FeeReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Fee collection dashboard: totals, overdue, by method, 6-month trend' })
  summary(@CurrentUser('tenantId') tenantId: string, @Query() query: FeeSummaryQueryDto) {
    return this.service.summary(tenantId, query.academicYearId);
  }

  @Get('defaulters')
  @ApiOperation({ summary: 'Students with overdue balances (largest first)' })
  defaulters(@CurrentUser('tenantId') tenantId: string, @Query() query: DefaultersQueryDto) {
    return this.service.defaulters(tenantId, query);
  }

  @Get('students/:studentId/ledger')
  @ApiOperation({ summary: 'Student fee ledger: invoices, payments and totals' })
  ledger(@CurrentUser('tenantId') tenantId: string, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.ledger(tenantId, studentId);
  }
}
