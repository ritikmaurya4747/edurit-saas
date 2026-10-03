import {
  Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantsLoginDto } from './dto/tenants-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @ApiOperation({ summary: 'Current user, school and roles' })
  async me(@Req() req: { user: { id: string; tenantId: string } }) {
    return this.authService.getMe(req.user.id, req.user.tenantId);
  }
}