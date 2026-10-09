import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';

const PORTAL_ROLES = ['STUDENT', 'PARENT'];

export interface PortalAccess {
  // The student whose own login this is (STUDENT login), if any.
  ownStudentId: string | null;
  // Children linked through Parent → StudentGuardian (PARENT login).
  childIds: string[];
  // Union of the above: everything this user may see.
  studentIds: string[];
}

export interface StudentAccess {
  studentId: string;
  isSelf: boolean;
  isGuardian: boolean;
}

// The single place that decides which students a portal user may see.
// Access is decided by identity (the login's own Student row, or the children
// of the login's Parent row) — never by permission codes.
@Injectable()
export class PortalAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isPortalRoleUser(user: AuthUser) {
    return !user.isAdmin && user.roles.length > 0 && user.roles.every((r) => PORTAL_ROLES.includes(r));
  }

  async resolveAccess(user: AuthUser): Promise<PortalAccess> {
    const [own, parent] = await Promise.all([
      this.prisma.student.findFirst({
        where: { tenantId: user.tenantId, userId: user.id, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.parent.findFirst({
        where: { tenantId: user.tenantId, userId: user.id, deletedAt: null },
        select: {
          children: {
            where: { student: { tenantId: user.tenantId, deletedAt: null } },
            select: { studentId: true },
          },
        },
      }),
    ]);
    const ownStudentId = own?.id ?? null;
    const childIds = [...new Set((parent?.children ?? []).map((c) => c.studentId))];
    const studentIds = [...new Set([...(ownStudentId ? [ownStudentId] : []), ...childIds])];

    // Staff/admins without a linked student or child have no business here.
    if (!studentIds.length && !this.isPortalRoleUser(user)) {
      throw new ForbiddenException('The portal is for students and parents');
    }
    return { ownStudentId, childIds, studentIds };
  }

  async resolveAccessibleStudentIds(user: AuthUser): Promise<string[]> {
    return (await this.resolveAccess(user)).studentIds;
  }

  // Every :studentId endpoint calls this first. Students the user may not see
  // are reported as "not found" so other students' existence is never revealed.
  async assertCanView(user: AuthUser, studentId: string): Promise<StudentAccess> {
    const access = await this.resolveAccess(user);
    if (!access.studentIds.includes(studentId)) throw new NotFoundException('Student not found');
    return {
      studentId,
      isSelf: access.ownStudentId === studentId,
      isGuardian: access.childIds.includes(studentId),
    };
  }
}
