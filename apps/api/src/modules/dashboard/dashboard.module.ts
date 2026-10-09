import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Home dashboard aggregates (read-only).
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
