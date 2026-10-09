import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

// School notice board: drafts, publishing, archiving and role-targeted reading.
@Module({
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class CommunicationModule {}
