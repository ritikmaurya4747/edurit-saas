import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/users.dto';

@ApiTags('Administration - Audit Log')
@TenantAuth(PERMISSIONS.AUDIT_READ)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Audit trail (newest first) filtered by entity, user, action and date range' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ListAuditLogsQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('facets')
  @ApiOperation({ summary: 'Distinct entity names and actions recorded (for filter dropdowns)' })
  facets(@CurrentUser('tenantId') tenantId: string) {
    return this.service.facets(tenantId);
  }
}
