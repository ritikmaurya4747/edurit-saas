import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import {
  CommitStaffImportDto,
  CommitStudentImportDto,
  MAX_COMMIT_ROWS,
  MAX_VALIDATE_ROWS,
  ValidateStaffImportDto,
  ValidateStudentImportDto,
} from './dto/imports.dto';
import { StudentImportService } from './student-import.service';
import { StaffImportService } from './staff-import.service';

// Excel / CSV bulk import. The browser parses the file and sends the rows in
// chunks: validate (no writes) → commit (re-validates, then saves row by row).
@ApiTags('Imports')
@TenantAuth(PERMISSIONS.STUDENT_CREATE)
@Controller({ path: 'imports', version: '1' })
export class ImportsController {
  constructor(
    private readonly students: StudentImportService,
    private readonly staff: StaffImportService,
  ) {}

  @Post('students/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Check up to ${MAX_VALIDATE_ROWS} student rows (no writes): per row { rowNumber, status ok|warning|error, errors, warnings, normalized }`,
  })
  validateStudents(@CurrentUser() user: AuthUser, @Body() dto: ValidateStudentImportDto) {
    return this.students.validate(user, dto);
  }

  @Post('students/commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Import up to ${MAX_COMMIT_ROWS} student rows (re-validated; each row admitted separately) and optionally issue student / parent logins`,
  })
  commitStudents(@CurrentUser() user: AuthUser, @Body() dto: CommitStudentImportDto) {
    return this.students.commit(user, dto);
  }

  @Post('staff/validate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.STAFF_CREATE)
  @ApiOperation({ summary: `Check up to ${MAX_VALIDATE_ROWS} staff rows (no writes)` })
  validateStaff(@CurrentUser() user: AuthUser, @Body() dto: ValidateStaffImportDto) {
    return this.staff.validate(user, dto);
  }

  @Post('staff/commit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.STAFF_CREATE)
  @ApiOperation({
    summary: `Import up to ${MAX_COMMIT_ROWS} staff rows; new accounts get a temporary password (returned once as credentials)`,
  })
  commitStaff(@CurrentUser() user: AuthUser, @Body() dto: CommitStaffImportDto) {
    return this.staff.commit(user, dto);
  }
}
