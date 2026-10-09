import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { VehiclesService } from './vehicles.service';
import { RoutesService } from './routes.service';
import { AssignmentsService } from './assignments.service';
import { TransportSummaryService } from './transport-summary.service';
import {
  AssignmentListQueryDto,
  CreateAssignmentDto,
  CreateRouteDto,
  CreateVehicleDto,
  EndAssignmentDto,
  ReplaceStopsDto,
  RouteListQueryDto,
  UpdateRouteDto,
  UpdateVehicleDto,
} from './dto/transport.dto';

@ApiTags('Transport')
@TenantAuth(PERMISSIONS.TRANSPORT_READ)
@Controller({ path: 'transport', version: '1' })
export class TransportController {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly routes: RoutesService,
    private readonly assignments: AssignmentsService,
    private readonly summaryService: TransportSummaryService,
  ) {}

  // ---------- Summary ----------
  @Get('summary')
  @ApiOperation({ summary: 'Transport tiles: vehicles, routes, riders, occupancy and expiring vehicle documents' })
  summary(@CurrentUser('tenantId') tenantId: string) {
    return this.summaryService.summary(tenantId);
  }

  // ---------- Vehicles ----------
  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles with routes, assigned students and insurance/fitness expiry warnings' })
  listVehicles(@CurrentUser('tenantId') tenantId: string) {
    return this.vehicles.list(tenantId);
  }

  @Post('vehicles')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Add a vehicle (registration number unique per school)' })
  createVehicle(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user, dto);
  }

  @Patch('vehicles/:id')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Update a vehicle (send null to clear optional fields)' })
  updateVehicle(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicles.update(user, id, dto);
  }

  @Delete('vehicles/:id')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Delete a vehicle (refused while it serves an active route)' })
  removeVehicle(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.remove(user, id);
  }

  // ---------- Routes ----------
  @Get('routes')
  @ApiOperation({ summary: 'List routes with vehicle, ordered stops, active students and occupancy' })
  listRoutes(@CurrentUser('tenantId') tenantId: string, @Query() query: RouteListQueryDto) {
    return this.routes.list(tenantId, query);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Route with stops and the students currently assigned' })
  getRoute(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.routes.get(tenantId, id);
  }

  @Post('routes')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Create a route (optionally with vehicle and stops in travel order)' })
  createRoute(@CurrentUser() user: AuthUser, @Body() dto: CreateRouteDto) {
    return this.routes.create(user, dto);
  }

  @Patch('routes/:id')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Update a route (vehicleId null unassigns the vehicle)' })
  updateRoute(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRouteDto) {
    return this.routes.update(user, id, dto);
  }

  @Put('routes/:id/stops')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Replace the stop list (keep ids to preserve assignments; stops in use cannot be removed)' })
  replaceStops(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceStopsDto) {
    return this.routes.replaceStops(user, id, dto);
  }

  @Delete('routes/:id')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Delete a route (refused while students are assigned)' })
  removeRoute(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.routes.remove(user, id);
  }

  // ---------- Assignments ----------
  @Get('assignments')
  @ApiOperation({ summary: 'List student transport assignments (active only unless includeInactive=true)' })
  listAssignments(@CurrentUser('tenantId') tenantId: string, @Query() query: AssignmentListQueryDto) {
    return this.assignments.list(tenantId, query);
  }

  @Post('assignments')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Assign a student to a route/stop (ends any previous assignment; checks vehicle capacity)' })
  assign(@CurrentUser() user: AuthUser, @Body() dto: CreateAssignmentDto) {
    return this.assignments.assign(user, dto);
  }

  @Post('assignments/:id/end')
  @RequirePermissions(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'End a transport assignment (defaults to today)' })
  endAssignment(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: EndAssignmentDto) {
    return this.assignments.end(user, id, dto);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: "A student's current transport assignment and history" })
  studentTransport(
    @CurrentUser('tenantId') tenantId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.assignments.forStudent(tenantId, studentId);
  }
}
