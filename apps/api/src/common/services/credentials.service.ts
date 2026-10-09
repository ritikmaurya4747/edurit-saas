import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';

type Tx = Prisma.TransactionClient | PrismaService;

// Synthesised parent emails (guardians admitted without an email) end with this.
export const PLACEHOLDER_EMAIL_DOMAIN = '@noemail.edurit.local';
const STUDENT_EMAIL_DOMAIN = 'students.edurit.in';
const BCRYPT_ROUNDS = 10;

// One issued (or linked) login, as shown on the credentials sheet.
export interface IssuedCredential {
  userId: string;
  role: 'STUDENT' | 'PARENT' | 'STAFF' | 'USER';
  name: string;
  // What the person types in the login box: admission no. (students),
  // mobile number (parents, when unique) or email.
  loginId: string;
  email: string | null;
  // Present only when a new password was set. Shown once, never stored.
  temporaryPassword: string | null;
  // The account already existed and is shared with another school, so its
  // password was NOT changed: the person keeps using their current password.
  existingAccount: boolean;
  studentName?: string;
  classLabel?: string | null;
}

const isPlaceholder = (email: string) => email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
const displayEmail = (email: string) => (isPlaceholder(email) ? null : email);

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  // Readable temporary password for printed sheets (no 0/O, 1/l/I):
  // e.g. "Kmt@4827". Users must change it at first login.
  generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const pick = (chars: string) => chars[randomInt(chars.length)];
    const digits = Array.from({ length: 4 }, () => String(randomInt(2, 10))).join('');
    return `${pick(upper)}${pick(lower)}${pick(lower)}@${digits}`;
  }

  hash(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // A user's password may only be (re)set from a school when that user
  // belongs to no other school; otherwise one school could take over an
  // account used elsewhere.
  async isExclusiveToTenant(userId: string, tenantId: string, tx: Tx = this.prisma) {
    const other = await tx.membership.count({ where: { userId, tenantId: { not: tenantId } } });
    return other === 0;
  }

  // Login id shown on credential sheets.
  async loginIdForUser(tenantId: string, user: { id: string; email: string; phone: string | null }, tx: Tx = this.prisma) {
    const student = await tx.student.findFirst({
      where: { tenantId, userId: user.id, deletedAt: null },
      select: { admissionNumber: true },
    });
    if (student) return student.admissionNumber;
    if (user.phone && (await this.isPhoneUniqueInTenant(tenantId, user.phone, tx))) return user.phone;
    return displayEmail(user.email) ?? user.email;
  }

  async isPhoneUniqueInTenant(tenantId: string, phone: string, tx: Tx = this.prisma) {
    const count = await tx.user.count({
      where: { phone, deletedAt: null, memberships: { some: { tenantId, status: 'ACTIVE' } } },
    });
    return count <= 1;
  }

  private async roleId(tenantId: string, code: string, tx: Tx) {
    const role = await tx.role.findUnique({ where: { tenantId_code: { tenantId, code } }, select: { id: true } });
    if (!role) throw new BadRequestException(`The ${code} role is missing for this school. Run the database seed.`);
    return role.id;
  }

  private async ensureMembership(tenantId: string, userId: string, roleCode: string, tx: Tx) {
    const membership = await tx.membership.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      update: {},
      create: { tenantId, userId, status: 'ACTIVE' },
    });
    if (membership.status === 'SUSPENDED') {
      throw new BadRequestException('This login is suspended. Re-activate it in Roles & Permissions → Users & Access.');
    }
    if (membership.status === 'INVITED') {
      await tx.membership.update({ where: { id: membership.id }, data: { status: 'ACTIVE' } });
    }
    const roleId = await this.roleId(tenantId, roleCode, tx);
    await tx.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId: membership.id, roleId } },
      update: {},
      create: { membershipId: membership.id, roleId },
    });
    return membership;
  }

  // Sets a new temporary password (or the given one) and forces a change at
  // next login. Refuses accounts shared with another school.
  async setTemporaryPassword(tenantId: string, userId: string, password?: string, tx: Tx = this.prisma) {
    if (!(await this.isExclusiveToTenant(userId, tenantId, tx))) {
      throw new ConflictException(
        'This login is also used at another school, so its password cannot be reset from here. Ask the person to use their existing password.',
      );
    }
    const temporaryPassword = password ?? this.generateTemporaryPassword();
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: await this.hash(temporaryPassword), mustChangePassword: true },
    });
    return temporaryPassword;
  }

  // ---------------------------------------------------------------------------
  // Students
  // ---------------------------------------------------------------------------

  // Creates (or resets) the portal login of a student. Students sign in with
  // their admission number; an email is optional.
  async issueStudentLogin(
    tenantId: string,
    studentId: string,
    opts: { email?: string | null; password?: string; resetExisting?: boolean } = {},
    tx: Tx = this.prisma,
  ): Promise<IssuedCredential> {
    const student = await tx.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      include: {
        user: true,
        enrollments: {
          where: { academicYear: { isCurrent: true } },
          include: { section: { include: { class: true } } },
          take: 1,
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const name = `${student.firstName} ${student.lastName}`.trim();
    const enrollment = student.enrollments[0];
    const classLabel = enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : null;
    const base = { role: 'STUDENT' as const, name, loginId: student.admissionNumber, studentName: name, classLabel };

    // Already has a login → optionally reset its password.
    if (student.user && !student.user.deletedAt) {
      await this.ensureMembership(tenantId, student.user.id, 'STUDENT', tx);
      let temporaryPassword: string | null = null;
      if (opts.resetExisting || opts.password) {
        temporaryPassword = await this.setTemporaryPassword(tenantId, student.user.id, opts.password, tx);
      }
      return { ...base, userId: student.user.id, email: displayEmail(student.user.email), temporaryPassword, existingAccount: false };
    }

    const requested = (opts.email ?? student.email)?.trim().toLowerCase() || null;
    let email = requested;
    if (email) {
      const taken = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (taken) {
        if (opts.email) throw new ConflictException(`${email} is already used by another login`);
        email = null; // student.email belongs to someone else (often a parent) → use a generated id
      }
    }
    if (!email) {
      const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } });
      const handle = student.admissionNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      email = `${handle}.${tenant.slug}@${STUDENT_EMAIL_DOMAIN}`;
    }

    const temporaryPassword = opts.password ?? this.generateTemporaryPassword();
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await this.hash(temporaryPassword),
        firstName: student.firstName || name,
        lastName: student.lastName,
        mustChangePassword: true,
      },
    });
    await this.ensureMembership(tenantId, user.id, 'STUDENT', tx);
    await tx.student.update({ where: { id: student.id }, data: { userId: user.id } });

    return { ...base, userId: user.id, email: displayEmail(email), temporaryPassword, existingAccount: false };
  }

  // ---------------------------------------------------------------------------
  // Parents
  // ---------------------------------------------------------------------------

  // Gives a guardian a usable login: optionally sets a real email (replacing a
  // placeholder) and issues a temporary password. Parents sign in with their
  // mobile number (when unique in the school) or email.
  async issueParentLogin(
    tenantId: string,
    parentId: string,
    opts: { email?: string | null; password?: string; resetExisting?: boolean; studentName?: string; classLabel?: string | null } = {},
    tx: Tx = this.prisma,
  ): Promise<IssuedCredential> {
    const parent = await tx.parent.findFirst({
      where: { id: parentId, tenantId, deletedAt: null },
      include: { user: true },
    });
    if (!parent) throw new NotFoundException('Guardian not found');
    let user = parent.user;
    const name = `${user.firstName} ${user.lastName}`.trim();
    await this.ensureMembership(tenantId, user.id, 'PARENT', tx);
    const exclusive = await this.isExclusiveToTenant(user.id, tenantId, tx);

    const newEmail = opts.email?.trim().toLowerCase();
    if (newEmail && newEmail !== user.email) {
      if (!exclusive) throw new ConflictException('This guardian login is shared with another school; its email cannot be changed here.');
      const taken = await tx.user.findUnique({ where: { email: newEmail }, select: { id: true } });
      if (taken) throw new ConflictException(`${newEmail} is already used by another login`);
      user = await tx.user.update({ where: { id: user.id }, data: { email: newEmail } });
    }

    // Accounts created at admission have a random password nobody knows, so
    // they need one — unless a temporary password was already issued and is
    // still unused (re-issuing would invalidate slips already handed out).
    // Explicit password / resetExisting always issue a new one.
    const neverUsable = !user.lastLoginAt && !user.mustChangePassword;
    const needsPassword = !!opts.password || !!opts.resetExisting || neverUsable;
    let temporaryPassword: string | null = null;
    let existingAccount = false;
    if (needsPassword) {
      if (exclusive) {
        temporaryPassword = await this.setTemporaryPassword(tenantId, user.id, opts.password, tx);
      } else {
        existingAccount = true;
      }
    }

    return {
      userId: user.id,
      role: 'PARENT',
      name,
      loginId: await this.loginIdForUser(tenantId, user, tx),
      email: displayEmail(user.email),
      temporaryPassword,
      existingAccount,
      studentName: opts.studentName,
      classLabel: opts.classLabel,
    };
  }
}
