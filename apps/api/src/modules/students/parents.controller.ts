import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { StudentsService } from './students.service';
import { ParentListQueryDto } from './dto/students.dto';

@ApiTags('Students - Parents')
@TenantAuth(PERMISSIONS.STUDENT_READ)
@Controller({ path: 'parents', version: '1' })
export class ParentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List parents (paginated) with their children' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: ParentListQueryDto) {
    return this.service.listParents(tenantId, query);
  }
}
