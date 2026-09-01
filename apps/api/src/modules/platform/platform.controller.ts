import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PlatformGuard } from '../../common/guards/platform.guard';
import { CurrentPlatformUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Platform Admin')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiOperation({ summary: 'Super Admin Login' })
  @ApiResponse({ status: 200, description: 'JWT Access token generated' })
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PlatformLoginDto) {
    return this.platformService.login(dto);
  }

  @ApiOperation({ summary: 'Provision a New School / Tenant' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Tenant initialized with branches, roles & admin' })
  @UseGuards(PlatformGuard)
  @Post('tenants')
  async createTenant(
    @Body() dto: CreateTenantDto,
    @CurrentPlatformUser('id') platformUserId: string,
  ) {
    return this.platformService.createTenant(dto, platformUserId);
  }

  @ApiOperation({ summary: 'List All Provisioned Tenants' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(PlatformGuard)
  @Get('tenants')
  async listTenants(@Query() query: PaginationQueryDto) {
    return this.platformService.listTenants(query);
  }
}