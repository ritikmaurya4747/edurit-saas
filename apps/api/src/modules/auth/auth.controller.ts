import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TenantsLoginDto } from './dto/tenants-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Tenant Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login for school staff and students via subdomain' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  async login(@Body() tenantsLoginDto: TenantsLoginDto) {
    return this.authService.login(tenantsLoginDto);
  }

  @Get('me')
  @TenantAuth()
  @ApiOperation({ summary: 'Current user, school, roles and effective permissions' })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}
