import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { PayrollService } from './payroll.service';
import { MonthQueryDto, PayrollPeriodDto, UpdatePayrollDto } from './dto/staff.dto';

@ApiTags('Staff & HR - Payroll')
@TenantAuth(PERMISSIONS.PAYROLL_MANAGE)
@Controller({ path: 'payroll', version: '1' })
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @ApiOperation({ summary: 'Payroll records for a month with totals' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: MonthQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate payroll for active staff without a record (loss-of-pay deducted)' })
  generate(@CurrentUser() user: AuthUser, @Body() dto: PayrollPeriodDto) {
    return this.service.generate(user, dto);
  }

  @Post('disburse-all')
  @ApiOperation({ summary: 'Mark every pending salary of the month as disbursed' })
  disburseAll(@CurrentUser() user: AuthUser, @Body() dto: PayrollPeriodDto) {
    return this.service.disburseAll(user, dto);
  }

  @Get(':id/payslip')
  @ApiOperation({ summary: 'Payslip data (school, staff, earnings, deductions, attendance)' })
  payslip(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.payslip(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit basic / allowances / deductions (recomputes net; not after disbursal)' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayrollDto) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/disburse')
  @ApiOperation({ summary: 'Mark salary as disbursed' })
  disburse(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.disburse(user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payroll record (only before disbursal)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
