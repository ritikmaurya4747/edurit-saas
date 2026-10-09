import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto, FeeStructureQueryDto, UpdateFeeStructureDto } from './dto/billing.dto';

@ApiTags('Billing - Fee Structures')
@TenantAuth(PERMISSIONS.INVOICE_READ)
@Controller({ path: 'fee-structures', version: '1' })
export class FeeStructuresController {
  constructor(private readonly service: FeeStructuresService) {}

  @Get()
  @ApiOperation({ summary: 'List fee structures with components and annual total (defaults to current year)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: FeeStructureQueryDto) {
    return this.service.list(tenantId, query.academicYearId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fee structure with components' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.FEE_STRUCTURE_MANAGE)
  @ApiOperation({ summary: 'Create fee structure with its components' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFeeStructureDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.FEE_STRUCTURE_MANAGE)
  @ApiOperation({ summary: 'Rename fee structure and/or replace its components' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeeStructureDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.FEE_STRUCTURE_MANAGE)
  @ApiOperation({ summary: 'Delete fee structure (soft delete; issued invoices are kept)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
