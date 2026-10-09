import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StudentLoginsService } from './student-logins.service';
import { BulkLoginsDto, IssueLoginDto } from './dto/student-logins.dto';

@ApiTags('Students - Portal Logins')
@TenantAuth(PERMISSIONS.STUDENT_UPDATE)
@Controller({ path: 'students', version: '1' })
export class StudentLoginsController {
  constructor(private readonly service: StudentLoginsService) {}

  @Post('logins/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create portal logins for a whole section (students and/or guardians); returns the credentials sheet' })
  bulk(@CurrentUser() user: AuthUser, @Body() dto: BulkLoginsDto) {
    return this.service.issueForSection(user, dto);
  }

  @Get(':id/login')
  @RequirePermissions(PERMISSIONS.STUDENT_READ)
  @ApiOperation({ summary: 'Portal login status of a student and their guardians' })
  status(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.status(user, id);
  }

  @Post(':id/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create (or reset) the student portal login; returns a one-time temporary password' })
  issueForStudent(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: IssueLoginDto) {
    return this.service.issueForStudent(user, id, dto);
  }

  @Post(':id/guardians/:guardianId/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Give a guardian a usable login (email optional); returns a one-time temporary password' })
  issueForGuardian(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Body() dto: IssueLoginDto,
  ) {
    return this.service.issueForGuardian(user, id, guardianId, dto);
  }
}
