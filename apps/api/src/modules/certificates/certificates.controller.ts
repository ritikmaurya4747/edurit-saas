import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, TenantAuth } from '../../common/decorators/tenant-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import type { AuthUser } from '../../common/types/auth-user';
import { CertificatesService } from './certificates.service';
import {
  CertificateListQueryDto,
  CertificatePreviewQueryDto,
  IdCardsQueryDto,
  IssueCertificateDto,
  IssueIdCardsDto,
  RevokeCertificateDto,
} from './dto/certificates.dto';

@ApiTags('Certificates & ID Cards')
@TenantAuth(PERMISSIONS.STUDENT_READ)
@Controller({ path: 'certificates', version: '1' })
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  @Get()
  @ApiOperation({ summary: 'Register of issued certificates (search by student name, admission no or serial)' })
  list(@CurrentUser() user: AuthUser, @Query() query: CertificateListQueryDto) {
    return this.service.list(user, query);
  }

  @Get('preview')
  @ApiOperation({
    summary: 'Data needed to render a certificate without issuing it',
    description: 'School letterhead, student and guardian details, enrollment, attendance and (TC) last exam result.',
  })
  preview(@CurrentUser() user: AuthUser, @Query() query: CertificatePreviewQueryDto) {
    return this.service.preview(user, query);
  }

  @Get('id-cards')
  @ApiOperation({ summary: 'ID card data for every active student of a section (does not issue anything)' })
  idCards(@CurrentUser() user: AuthUser, @Query() query: IdCardsQueryDto) {
    return this.service.idCards(user, query);
  }

  @Post('id-cards/issue')
  @RequirePermissions(PERMISSIONS.CERTIFICATE_ISSUE)
  @ApiOperation({
    summary: 'Record ID cards as issued for a section',
    description: 'Skips students that already hold a non-revoked ID card with the same valid-upto date.',
  })
  issueIdCards(@CurrentUser() user: AuthUser, @Body() dto: IssueIdCardsDto) {
    return this.service.issueIdCards(user, dto);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CERTIFICATE_ISSUE)
  @ApiOperation({
    summary: 'Issue a certificate (TC, Bonafide, Character or ID card)',
    description:
      'Stores the submitted fields plus a frozen snapshot of the preview. A TC requires leavingDate and reason and ' +
      'marks an ACTIVE student as TRANSFERRED.',
  })
  issue(@CurrentUser() user: AuthUser, @Body() dto: IssueCertificateDto) {
    return this.service.issue(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Issued certificate with its stored snapshot (for reprint)' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(user, id);
  }

  @Post(':id/revoke')
  @RequirePermissions(PERMISSIONS.CERTIFICATE_ISSUE)
  @ApiOperation({ summary: 'Revoke an issued certificate (a revoked TC does not reactivate the student)' })
  revoke(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RevokeCertificateDto) {
    return this.service.revoke(user, id, dto);
  }
}
