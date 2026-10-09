import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicAdmissionEnquiryDto } from './dto/public-admission.dto';
import { PublicAdmissionsService } from './public-admissions.service';

// PUBLIC (no auth): the school's online admission form at https://<slug>.edurit.in/apply.
// Rate limits are per client IP (the web server forwards it in X-Forwarded-For,
// Fastify trustProxy is on).
@ApiTags('Public - Online Admissions')
@Controller({ path: 'public/schools', version: '1' })
export class PublicAdmissionsController {
  constructor(private readonly service: PublicAdmissionsService) {}

  @Get(':slug/admission-form')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'School branding, whether online admissions are open, the message and the classes offered' })
  @ApiNotFoundResponse({ description: 'School not found / suspended' })
  @ApiTooManyRequestsResponse({ description: 'More than 30 requests a minute from this IP' })
  getAdmissionForm(@Param('slug') slug: string) {
    return this.service.getAdmissionForm(slug);
  }

  @Post(':slug/admission-enquiries')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Submit an online admission enquiry (lands in the Admissions pipeline as ONLINE_FORM)' })
  @ApiNotFoundResponse({ description: 'School not found / suspended' })
  @ApiForbiddenResponse({ description: 'Online admissions are currently closed' })
  @ApiTooManyRequestsResponse({ description: 'More than 5 submissions in 10 minutes from this IP' })
  submitEnquiry(@Param('slug') slug: string, @Body() dto: PublicAdmissionEnquiryDto) {
    return this.service.submitEnquiry(slug, dto);
  }
}
