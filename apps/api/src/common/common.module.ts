import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuditService } from './services/audit.service';
import { StaffContextService } from './services/staff-context.service';

// Global: every feature module can use @TenantAuth() (JwtAuthGuard needs
// PassportModule's AuthModuleOptions) and the shared services below.
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [AuditService, StaffContextService],
  exports: [PassportModule, AuditService, StaffContextService],
})
export class CommonModule {}
