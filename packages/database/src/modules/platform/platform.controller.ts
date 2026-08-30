import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { PlatformLoginDto } from './dto/platform-login.dto';

@ApiTags('Platform Admin')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiOperation({ summary: 'Super Admin Login' })
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PlatformLoginDto) {
    return this.platformService.login(dto);
  }
}