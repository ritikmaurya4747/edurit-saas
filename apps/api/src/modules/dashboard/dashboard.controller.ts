import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@TenantAuth()
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Home dashboard: attendance, fees (with invoices:read), approvals, trends, notices, exams, birthdays',
  })
  overview(@CurrentUser() user: AuthUser) {
    return this.service.overview(user);
  }
}
