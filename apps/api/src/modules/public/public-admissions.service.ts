import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AdmissionStage } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { formatDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date';
import {
  isPlainObject,
  ONLINE_FORM_SOURCE,
  readOnlineFormSettings,
  uniqueSorted,
} from '../admissions/online-form.settings';
import type { PublicAdmissionEnquiryDto } from './dto/public-admission.dto';

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CLOSED_MESSAGE = 'Online admissions are currently closed';

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

// Short human reference shown to the parent, e.g. ENQ-3F9A1C.
const referenceFor = (id: string) => `ENQ-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

@Injectable()
export class PublicAdmissionsService {
  private readonly logger = new Logger(PublicAdmissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Public, unauthenticated: only expose what a school prints on its prospectus.
  async getAdmissionForm(slug: string) {
    const school = await this.findSchool(slug);
    const settings = readOnlineFormSettings(school.themeConfig);
    const classes = await this.offeredClasses(school.id, settings.classesOpen);
    return {
      school: school.profile,
      enabled: settings.onlineFormEnabled,
      message: settings.formMessage || null,
      classes,
      academicYearLabel: settings.academicYearLabel || school.currentYearName || null,
    };
  }

  async submitEnquiry(slug: string, dto: PublicAdmissionEnquiryDto) {
    const school = await this.findSchool(slug);
    const settings = readOnlineFormSettings(school.themeConfig);
    if (!settings.onlineFormEnabled) throw new ForbiddenException(CLOSED_MESSAGE);

    // Honeypot filled in → pretend success, store nothing.
    if (dto.website && dto.website.trim() !== '') {
      this.logger.warn(`Online admission form: honeypot triggered for school '${slug}'`);
      return { reference: `ENQ-${randomBytes(3).toString('hex').toUpperCase()}` };
    }

    const classes = await this.offeredClasses(school.id, settings.classesOpen);
    if (!classes.length) throw new ForbiddenException(CLOSED_MESSAGE);
    const classApplied = classes.find((c) => c.toLowerCase() === dto.classApplied.toLowerCase());
    if (!classApplied) {
      throw new BadRequestException(`Admissions are not open for '${dto.classApplied}'. Please choose one of: ${classes.join(', ')}`);
    }

    const dob = this.validateDob(dto.dob, school.timezone);
    const phone = `+91${dto.phone}`;

    // Same child + same phone within 24h (double click, resubmission) → same enquiry.
    const existing = await this.prisma.admissionEnquiry.findFirst({
      where: {
        tenantId: school.id,
        phone: { endsWith: dto.phone },
        studentName: { equals: dto.studentName, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existing) return { reference: referenceFor(existing.id) };

    const noteLines = [
      'Submitted via the online admission form.',
      settings.academicYearLabel && `Academic year: ${settings.academicYearLabel}`,
      dto.address && `Address: ${dto.address}`,
      dto.previousSchool && `Previous school: ${dto.previousSchool}`,
      dto.notes && `Message from parent: ${dto.notes}`,
    ].filter(Boolean);

    const enquiry = await this.prisma.admissionEnquiry.create({
      data: {
        tenantId: school.id,
        studentName: dto.studentName,
        parentName: dto.parentName,
        phone,
        email: dto.email ?? null,
        dob,
        gender: dto.gender,
        classApplied,
        source: ONLINE_FORM_SOURCE,
        stage: AdmissionStage.ENQUIRY,
        notes: noteLines.join('\n'),
      },
      select: { id: true },
    });

    return { reference: referenceFor(enquiry.id) };
  }

  private validateDob(value: string, timezone: string) {
    let dob: Date;
    try {
      dob = parseDateOnly(value);
    } catch {
      throw new BadRequestException('Please enter a valid date of birth');
    }
    // Reject impossible calendar dates such as 2019-02-31 (Date.UTC rolls them over).
    if (formatDateOnly(dob) !== value) throw new BadRequestException('Please enter a valid date of birth');

    const today = todayDateOnly(timezone);
    if (dob >= today) throw new BadRequestException('Date of birth must be in the past');
    const ageYears = (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 1 || ageYears > 25) {
      throw new BadRequestException('Please check the date of birth (the student should be between 1 and 25 years old)');
    }
    return dob;
  }

  // Configured classes that still exist (school's spelling), or every class.
  private async offeredClasses(tenantId: string, classesOpen: string[]) {
    const rows = await this.prisma.class.findMany({ where: { tenantId, deletedAt: null }, select: { name: true } });
    const all = uniqueSorted(rows.map((r) => r.name));
    if (!classesOpen.length) return all;
    const open = new Set(classesOpen.map((c) => c.trim().toLowerCase()));
    return all.filter((name) => open.has(name.toLowerCase()));
  }

  private async findSchool(rawSlug: string) {
    const slug = (rawSlug ?? '').trim().toLowerCase();
    const notFound = new NotFoundException('School not found. Please check the link.');
    if (!SLUG.test(slug)) throw notFound;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        status: true,
        deletedAt: true,
        settings: { select: { logoUrl: true, timezone: true, themeConfig: true } },
        academicYears: { where: { isCurrent: true, deletedAt: null }, select: { name: true }, take: 1 },
      },
    });
    if (!tenant || tenant.deletedAt || tenant.status === 'SUSPENDED') throw notFound;

    const theme = isPlainObject(tenant.settings?.themeConfig) ? tenant.settings.themeConfig : {};
    const profile = isPlainObject(theme.profile) ? theme.profile : {};
    const logoUrl = str(tenant.settings?.logoUrl);

    return {
      id: tenant.id,
      timezone: tenant.settings?.timezone || 'Asia/Kolkata',
      themeConfig: tenant.settings?.themeConfig,
      currentYearName: tenant.academicYears[0]?.name ?? null,
      profile: {
        name: tenant.name,
        // Only web/data URLs; anything else could be abused in an <img src>.
        logoUrl: /^(https?:\/\/|data:image\/)/i.test(logoUrl) ? logoUrl : null,
        address: str(profile.address) || null,
        city: str(profile.city) || null,
        state: str(profile.state) || null,
        pincode: str(profile.pincode) || null,
        phone: str(profile.phone) || null,
        email: str(profile.email) || null,
        website: str(profile.website) || null,
        affiliationBoard: str(profile.affiliationBoard) || null,
      },
    };
  }
}
