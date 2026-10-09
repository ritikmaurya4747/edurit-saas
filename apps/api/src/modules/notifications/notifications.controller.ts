import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@TenantAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Header bell: actionable alerts for the current user (permission-aware, computed live)' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user);
  }
}
