import { Module } from '@nestjs/common';
import { ExaminationModule } from '../examination/examination.module';
import { PortalAccessService } from './portal-access.service';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

// Student / parent self-service portal (/v1/portal/*). Results reuse the
// examination module's MarksService so grades and ranks match staff screens.
@Module({
  imports: [ExaminationModule],
  controllers: [PortalController],
  providers: [PortalService, PortalAccessService],
  exports: [PortalAccessService],
})
export class PortalModule {}
