import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { VisitorsService } from './visitors.service';
import { InfirmaryService } from './infirmary.service';
import { InventoryService } from './inventory.service';
import { ComplianceService } from './compliance.service';
import { OperationsSummaryService } from './operations-summary.service';
import {
  AdjustStockDto,
  ComplianceListQueryDto,
  CreateComplianceDto,
  CreateInfirmaryVisitDto,
  CreateInventoryItemDto,
  CreateVisitorDto,
  InfirmaryListQueryDto,
  InventoryListQueryDto,
  UpdateComplianceDto,
  UpdateInventoryItemDto,
  VisitorListQueryDto,
} from './dto/operations.dto';

@ApiTags('Operations - Summary')
@TenantAuth(PERMISSIONS.OPERATIONS_READ)
@Controller({ path: 'operations', version: '1' })
export class OperationsSummaryController {
  constructor(private readonly service: OperationsSummaryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Front office summary tiles (visitors, infirmary, low stock, compliance)' })
  summary(@CurrentUser('tenantId') tenantId: string) {
    return this.service.summary(tenantId);
  }
}

@ApiTags('Operations - Visitors')
@TenantAuth(PERMISSIONS.OPERATIONS_READ)
@Controller({ path: 'visitors', version: '1' })
export class VisitorsController {
  constructor(private readonly service: VisitorsService) {}

  @Get()
  @ApiOperation({ summary: 'List visitors (filter by day, still inside, search)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: VisitorListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Check in a visitor (now)' })
  checkIn(@CurrentUser() user: AuthUser, @Body() dto: CreateVisitorDto) {
    return this.service.checkIn(user, dto);
  }

  @Post(':id/check-out')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Check out a visitor (now)' })
  checkOut(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.checkOut(user, id);
  }
}

@ApiTags('Operations - Infirmary')
@TenantAuth(PERMISSIONS.OPERATIONS_READ)
@Controller({ path: 'infirmary-visits', version: '1' })
export class InfirmaryController {
  constructor(private readonly service: InfirmaryService) {}

  @Get()
  @ApiOperation({ summary: 'List infirmary visits with student and class-section' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: InfirmaryListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Log an infirmary visit' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInfirmaryVisitDto) {
    return this.service.create(user, dto);
  }
}

@ApiTags('Operations - Inventory')
@TenantAuth(PERMISSIONS.OPERATIONS_READ)
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items (with lowStock flag)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: InventoryListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Add an inventory item' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInventoryItemDto) {
    return this.service.create(user, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Stock movement / change history of an item' })
  history(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.history(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Update item details (quantity changes go through /adjust)' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/adjust')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Adjust stock by a positive or negative delta' })
  adjust(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto) {
    return this.service.adjust(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Delete an inventory item' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}

@ApiTags('Operations - Compliance')
@TenantAuth(PERMISSIONS.OPERATIONS_READ)
@Controller({ path: 'compliance', version: '1' })
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get()
  @ApiOperation({ summary: 'List compliance records (with computed isOverdue / daysUntilDue)' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ComplianceListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Add a compliance record' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateComplianceDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Update a compliance record (incl. status change)' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateComplianceDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.OPERATIONS_MANAGE)
  @ApiOperation({ summary: 'Delete a compliance record' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
