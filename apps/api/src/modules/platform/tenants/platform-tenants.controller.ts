import { Controller, Post, Get, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { PlatformTenantsService } from "./platform-tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { PlatformGuard } from "../../../common/guards/platform.guard";
import { CurrentPlatformUser } from "../../../common/decorators/current-user.decorator";

@ApiTags("Platform Admin - Tenants")
@ApiBearerAuth("JWT-auth")
@UseGuards(PlatformGuard)
@Controller("platform/tenants")
export class PlatformTenantsController {
  constructor(private readonly platformTenantsService: PlatformTenantsService) {}

  @ApiOperation({ summary: "Provision a New School / Tenant" })
  @ApiResponse({ status: 201, description: "Tenant initialized with branches, roles & admin" })
  @Post()
  async createTenant(
    @Body() dto: CreateTenantDto,
    @CurrentPlatformUser("id") platformUserId: string,
  ) {
    return this.platformTenantsService.createTenant(dto, platformUserId);
  }

  @ApiOperation({ summary: "List All Provisioned Tenants" })
  @Get()
  async listTenants(@Query() query: PaginationQueryDto) {
    return this.platformTenantsService.listTenants(query);
  }
}