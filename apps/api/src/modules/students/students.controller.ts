import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { StudentsService } from './students.service';
import {
  AddGuardianDto,
  CreateStudentDto,
  PromoteStudentsDto,
  StudentListQueryDto,
  StudentOptionsQueryDto,
  UpdateEnrollmentDto,
  UpdateStudentDto,
} from './dto/students.dto';

@ApiTags('Students')
@TenantAuth(PERMISSIONS.STUDENT_READ)
@Controller({ path: 'students', version: '1' })
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List students (paginated) with current enrollment and primary guardian' })
  list(@CurrentUser('tenantId') tenantId: string, @Query() query: StudentListQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get('options')
  @ApiOperation({ summary: 'Student dropdown options (ACTIVE, current-year enrollment, sorted by roll number)' })
  options(@CurrentUser('tenantId') tenantId: string, @Query() query: StudentOptionsQueryDto) {
    return this.service.options(tenantId, query);
  }

  @Post('promote')
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Promote students of a section into a section of another academic year' })
  promote(@CurrentUser() user: AuthUser, @Body() dto: PromoteStudentsDto) {
    return this.service.promote(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Student profile with enrollments, guardians, attendance and fee summary' })
  get(@CurrentUser('tenantId') tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STUDENT_CREATE)
  @ApiOperation({ summary: 'Admit a student (student + enrollment + optional primary guardian)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStudentDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Update student profile / status' })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STUDENT_DELETE)
  @ApiOperation({ summary: 'Archive (soft delete) a student' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }

  @Put(':id/enrollment')
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Create or move the enrollment (section / roll number) for an academic year' })
  setEnrollment(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.service.setEnrollment(user, id, dto);
  }

  @Post(':id/guardians')
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Add a guardian (existing parent or new contact)' })
  addGuardian(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AddGuardianDto) {
    return this.service.addGuardian(user, id, dto);
  }

  @Delete(':id/guardians/:guardianId')
  @RequirePermissions(PERMISSIONS.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Remove a guardian link from a student' })
  removeGuardian(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
  ) {
    return this.service.removeGuardian(user, id, guardianId);
  }
}
