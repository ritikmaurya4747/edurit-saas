import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  CredentialsService,
  IssuedCredential,
  PLACEHOLDER_EMAIL_DOMAIN,
} from '../../common/services/credentials.service';
import type { AuthUser } from '../../common/types/auth-user';
import { BulkLoginsDto, IssueLoginDto } from './dto/student-logins.dto';

// Portal logins for students and their guardians. Temporary passwords are
// returned once (for the credentials sheet) and never stored in plain text.
@Injectable()
export class StudentLoginsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
    private readonly audit: AuditService,
  ) {}

  // Who can sign in for this student: the student's own login and each guardian's.
  async status(user: AuthUser, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId: user.tenantId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, lastLoginAt: true, mustChangePassword: true, deletedAt: true } },
        guardians: {
          orderBy: { isPrimary: 'desc' },
          include: {
            parent: {
              include: {
                user: {
                  select: { id: true, email: true, phone: true, firstName: true, lastName: true, lastLoginAt: true, mustChangePassword: true },
                },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const memberships = await this.prisma.membership.findMany({
      where: {
        tenantId: user.tenantId,
        userId: { in: [student.user?.id, ...student.guardians.map((g) => g.parent.user.id)].filter((id): id is string => !!id) },
      },
      select: { id: true, userId: true, status: true },
    });
    const membershipOf = (userId: string) => memberships.find((m) => m.userId === userId);
    const isPlaceholder = (email: string) => email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);

    const studentLogin = student.user && !student.user.deletedAt ? student.user : null;
    return {
      student: {
        hasLogin: !!studentLogin,
        loginId: student.admissionNumber,
        email: studentLogin && !studentLogin.email.endsWith('@students.edurit.in') ? studentLogin.email : null,
        lastLoginAt: studentLogin?.lastLoginAt ?? null,
        mustChangePassword: studentLogin?.mustChangePassword ?? false,
        status: studentLogin ? membershipOf(studentLogin.id)?.status ?? null : null,
      },
      guardians: await Promise.all(
        student.guardians.map(async (g) => {
          const u = g.parent.user;
          // Guardian accounts created at admission get a random password nobody
          // knows: usable only once a temporary password was issued or the
          // guardian has signed in at least once.
          const hasUsableLogin = !!u.lastLoginAt || u.mustChangePassword;
          return {
            guardianId: g.id,
            parentId: g.parentId,
            relationship: g.relationship,
            isPrimary: g.isPrimary,
            name: `${u.firstName} ${u.lastName}`.trim(),
            phone: u.phone,
            email: isPlaceholder(u.email) ? null : u.email,
            hasUsableLogin,
            loginId: await this.credentials.loginIdForUser(user.tenantId, u),
            lastLoginAt: u.lastLoginAt,
            mustChangePassword: u.mustChangePassword,
            status: membershipOf(u.id)?.status ?? null,
          };
        }),
      ),
    };
  }

  async issueForStudent(user: AuthUser, studentId: string, dto: IssueLoginDto) {
    const credential = await this.prisma.$transaction((tx) =>
      this.credentials.issueStudentLogin(user.tenantId, studentId, dto, tx),
    );
    await this.audit.log(user, credential.temporaryPassword ? 'ISSUE_LOGIN' : 'LINK_LOGIN', 'Student', studentId, {
      loginUserId: credential.userId,
    });
    return credential;
  }

  async issueForGuardian(user: AuthUser, studentId: string, guardianId: string, dto: IssueLoginDto) {
    const guardian = await this.prisma.studentGuardian.findFirst({
      where: { id: guardianId, studentId, student: { tenantId: user.tenantId, deletedAt: null } },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
    if (!guardian) throw new NotFoundException('Guardian not found for this student');

    const credential = await this.prisma.$transaction((tx) =>
      this.credentials.issueParentLogin(
        user.tenantId,
        guardian.parentId,
        { ...dto, studentName: `${guardian.student.firstName} ${guardian.student.lastName}`.trim() },
        tx,
      ),
    );
    await this.audit.log(user, 'ISSUE_LOGIN', 'Parent', guardian.parentId, { studentId, loginUserId: credential.userId });
    return credential;
  }

  // Credentials for a whole section in one go (onboarding / new session).
  // Each person is handled in its own transaction so one problem (e.g. an
  // account shared with another school) never blocks the rest.
  async issueForSection(user: AuthUser, dto: BulkLoginsDto) {
    const includeStudents = dto.includeStudents ?? true;
    const includeParents = dto.includeParents ?? true;
    if (!includeStudents && !includeParents) throw new BadRequestException('Choose students, parents or both');

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, tenantId: user.tenantId, deletedAt: null },
      include: { class: { select: { name: true } } },
    });
    if (!section) throw new NotFoundException('Section not found');
    const classLabel = `${section.class.name} - ${section.name}`;

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId: user.tenantId,
        sectionId: section.id,
        academicYear: { isCurrent: true },
        student: { deletedAt: null, status: 'ACTIVE' },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            guardians: { select: { parentId: true, isPrimary: true } },
          },
        },
      },
      orderBy: [{ rollNumber: 'asc' }],
    });
    if (!enrollments.length) throw new BadRequestException(`No active students in ${classLabel} this year`);

    const issued: IssuedCredential[] = [];
    const skipped: { name: string; role: string; reason: string }[] = [];
    const seenParents = new Set<string>();

    for (const { student } of enrollments) {
      const studentName = `${student.firstName} ${student.lastName}`.trim();
      if (includeStudents) {
        if (student.userId && !dto.resetExisting) {
          skipped.push({ name: studentName, role: 'STUDENT', reason: 'Already has a login' });
        } else {
          await this.collect(issued, skipped, studentName, 'STUDENT', () =>
            this.prisma.$transaction((tx) =>
              this.credentials.issueStudentLogin(user.tenantId, student.id, { resetExisting: dto.resetExisting }, tx),
            ),
          );
        }
      }
      if (includeParents) {
        // Primary guardian first; a parent of siblings appears only once.
        const guardians = [...student.guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        for (const g of guardians) {
          if (seenParents.has(g.parentId)) continue;
          seenParents.add(g.parentId);
          await this.collect(issued, skipped, `Guardian of ${studentName}`, 'PARENT', () =>
            this.prisma.$transaction((tx) =>
              this.credentials.issueParentLogin(
                user.tenantId,
                g.parentId,
                { resetExisting: dto.resetExisting, studentName, classLabel },
                tx,
              ),
            ),
          );
        }
      }
    }

    // A parent that already logs in (and wasn't reset) has nothing to print.
    const credentials = issued.filter((c) => c.temporaryPassword || c.existingAccount);
    issued
      .filter((c) => !c.temporaryPassword && !c.existingAccount)
      .forEach((c) => skipped.push({ name: c.name, role: c.role, reason: 'Already has a login' }));

    await this.audit.log(user, 'BULK_ISSUE_LOGINS', 'Section', section.id, {
      classLabel,
      issued: credentials.length,
      skipped: skipped.length,
    });
    return { classLabel, credentials, skipped };
  }

  private async collect(
    issued: IssuedCredential[],
    skipped: { name: string; role: string; reason: string }[],
    name: string,
    role: string,
    run: () => Promise<IssuedCredential>,
  ) {
    try {
      issued.push(await run());
    } catch (error) {
      skipped.push({ name, role, reason: (error as Error).message });
    }
  }
}
