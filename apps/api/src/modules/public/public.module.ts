import { Module } from '@nestjs/common';
import { PublicAdmissionsController } from './public-admissions.controller';
import { PublicAdmissionsService } from './public-admissions.service';

// Unauthenticated endpoints for parents/visitors (no @TenantAuth anywhere in
// this module). Every route resolves the school from its slug and must never
// expose ids or internal data.
@Module({
  controllers: [PublicAdmissionsController],
  providers: [PublicAdmissionsService],
})
export class PublicModule {}
