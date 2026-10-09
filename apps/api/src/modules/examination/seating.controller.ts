import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { SeatingService } from './seating.service';
import { GenerateSeatingDto, MarkPrintedDto, SeatingQueryDto, UpdateExamSeatDto } from './dto/examination.dto';

@ApiTags('Examination - Seating & Desk Slips')
@TenantAuth(PERMISSIONS.EXAM_READ)
@Controller({ version: '1' })
export class SeatingController {
  constructor(private readonly service: SeatingService) {}

  @Post('exams/:id/seating/generate')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Auto-assign exam seats for the chosen sections across rooms' })
  generate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: GenerateSeatingDto) {
    return this.service.generate(user, id, dto);
  }

  @Get('exams/:id/seating')
  @ApiOperation({ summary: 'Seating plan of an exam (filter by room / section)' })
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SeatingQueryDto,
  ) {
    return this.service.list(tenantId, id, query);
  }

  @Post('exams/:id/seating/mark-printed')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Mark desk slips as printed (all seats or the given ones)' })
  markPrinted(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MarkPrintedDto) {
    return this.service.markPrinted(user, id, dto);
  }

  @Delete('exams/:id/seating')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Clear the whole seating plan of an exam' })
  clear(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.clear(user, id);
  }

  @Patch('exam-seats/:id')
  @RequirePermissions(PERMISSIONS.EXAM_CREATE)
  @ApiOperation({ summary: 'Move a seat or change its status' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamSeatDto) {
    return this.service.update(user, id, dto);
  }
}
