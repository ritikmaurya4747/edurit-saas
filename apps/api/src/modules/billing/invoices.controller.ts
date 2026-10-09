import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { InvoicesService } from './invoices.service';
import { BulkInvoiceDto, CreateInvoiceDto, InvoiceListQueryDto, VoidInvoiceDto } from './dto/billing.dto';

@ApiTags('Billing - Invoices')
@TenantAuth(PERMISSIONS.INVOICE_READ)
@Controller({ path: 'invoices', version: '1' })
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices (filters: status, search, class/section, student, overdue, year)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: InvoiceListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Invoice with items, payments and refunds' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVOICE_CREATE)
  @ApiOperation({ summary: 'Create an invoice for one student (totals computed server-side)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.service.create(user, dto);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.INVOICE_CREATE)
  @ApiOperation({ summary: 'Generate invoices from a fee structure for a class or section (optionally in installments)' })
  bulk(@CurrentUser() user: AuthUser, @Body() dto: BulkInvoiceDto) {
    return this.service.bulkCreate(user, dto);
  }

  @Post(':id/void')
  @RequirePermissions(PERMISSIONS.INVOICE_CREATE)
  @ApiOperation({ summary: 'Void an unpaid invoice' })
  void(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: VoidInvoiceDto) {
    return this.service.void(user, id, dto);
  }
}
