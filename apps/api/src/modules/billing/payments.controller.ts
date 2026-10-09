import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CreateRefundDto, PaymentListQueryDto, RefundListQueryDto } from './dto/billing.dto';

@ApiTags('Billing - Payments')
@TenantAuth(PERMISSIONS.INVOICE_READ)
@Controller({ version: '1' })
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('payments')
  @RequirePermissions(PERMISSIONS.PAYMENT_COLLECT)
  @ApiOperation({ summary: 'Collect a fee payment (idempotent by idempotencyKey); returns the receipt' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.service.create(user, dto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments / receipts (filters: search, method, from, to)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: PaymentListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Printable receipt for a payment' })
  receipt(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.receipt(tenantId, id);
  }

  @Post('payments/:id/refunds')
  @RequirePermissions(PERMISSIONS.PAYMENT_REFUND)
  @ApiOperation({ summary: 'Refund part or all of a payment (re-opens the invoices it settled)' })
  refund(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRefundDto) {
    return this.service.refund(user, id, dto);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List refunds' })
  refunds(@CurrentUser('tenantId') tenantId: string, @Query() query: RefundListQueryDto) {
    return this.service.listRefunds(tenantId, query);
  }
}
