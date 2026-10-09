import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

// Administration: roles & permission matrix, user access (memberships) and
// the tenant audit log.
@Module({
  controllers: [RolesController, MembersController, AuditLogsController],
  providers: [RolesService, MembersService, AuditLogsService],
  exports: [RolesService],
})
export class UsersModule {}
