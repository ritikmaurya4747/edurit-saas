import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantsLoginDto } from './dto/tenants-login.dto';

@ApiTags('Tenant Authentication')
@Controller({ path: 'auth', version: '1' }) 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for school staff and students via subdomain' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  async login(@Body() tenantsLoginDto: TenantsLoginDto) {
    return this.authService.login(tenantsLoginDto);
  }
}