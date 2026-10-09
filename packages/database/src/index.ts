import * as prismaClientModule from '../generated/client/index.js';
import { PrismaClient } from '../generated/client/index.js';

export * from '../generated/client/index.js';

export const prisma = new PrismaClient();

// NOTE: kept in this file on purpose. Node loads this package's TypeScript
// source directly (type stripping, ESM), where an extensionless relative
// import such as './rbac' cannot be resolved.

// Single source of truth for tenant RBAC: the permission catalogue and the
// default permissions granted to each system role. Used by the seed script,
// tenant provisioning and the API permission guard.

export interface PermissionDefinition {
  code: string;
  module: string;
  description: string;
}

export const PERMISSIONS = {
  // Branch & academic structure
  BRANCH_CREATE: 'branch:create',
  BRANCH_READ: 'branch:read',
  BRANCH_UPDATE: 'branch:update',
  BRANCH_DELETE: 'branch:delete',
  ACADEMIC_READ: 'academic:read',
  ACADEMIC_YEAR_MANAGE: 'academic_year:manage',
  CLASS_MANAGE: 'class:manage',
  SUBJECT_MANAGE: 'subject:manage',
  TIMETABLE_MANAGE: 'timetable:manage',

  // Students & admissions
  STUDENT_CREATE: 'students:create',
  STUDENT_READ: 'students:read',
  STUDENT_UPDATE: 'students:update',
  STUDENT_DELETE: 'students:delete',
  ADMISSIONS_READ: 'admissions:read',
  ADMISSIONS_MANAGE: 'admissions:manage',

  // Staff & HR
  STAFF_CREATE: 'staff:create',
  STAFF_READ: 'staff:read',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  STAFF_LEAVE_APPROVE: 'staff_leave:approve',
  STAFF_ATTENDANCE_MANAGE: 'staff_attendance:manage',
  PAYROLL_MANAGE: 'payroll:manage',

  // Attendance
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_APPROVE_LEAVE: 'attendance:approve_leave',

  // Homework
  HOMEWORK_READ: 'homework:read',
  HOMEWORK_MANAGE: 'homework:manage',

  // Fees & billing
  FEE_STRUCTURE_MANAGE: 'fees:structure_manage',
  INVOICE_CREATE: 'invoices:create',
  INVOICE_READ: 'invoices:read',
  PAYMENT_COLLECT: 'payments:collect',
  PAYMENT_REFUND: 'payments:refund',

  // Examinations
  EXAM_READ: 'exams:read',
  EXAM_CREATE: 'exams:create',
  MARKS_ENTRY: 'marks:entry',
  REPORT_CARD_GENERATE: 'report_cards:generate',

  // Communication
  NOTICE_READ: 'notices:read',
  NOTICE_PUBLISH: 'notices:publish',

  // Front office & operations (visitors, infirmary, inventory, compliance)
  OPERATIONS_READ: 'operations:read',
  OPERATIONS_MANAGE: 'operations:manage',

  // Academic calendar (reading uses ACADEMIC_READ)
  CALENDAR_MANAGE: 'calendar:manage',

  // Transport
  TRANSPORT_READ: 'transport:read',
  TRANSPORT_MANAGE: 'transport:manage',

  // Library
  LIBRARY_READ: 'library:read',
  LIBRARY_MANAGE: 'library:manage',

  // Certificates & ID cards
  CERTIFICATE_ISSUE: 'certificates:issue',

  // Administration
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type PermissionCodeValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

export const PERMISSION_CATALOGUE: PermissionDefinition[] = [
  { code: P.BRANCH_CREATE, module: 'Branch', description: 'Create branch' },
  { code: P.BRANCH_READ, module: 'Branch', description: 'View branches' },
  { code: P.BRANCH_UPDATE, module: 'Branch', description: 'Update branch' },
  { code: P.BRANCH_DELETE, module: 'Branch', description: 'Delete branch' },

  { code: P.ACADEMIC_READ, module: 'Academic', description: 'View academic years, classes, subjects and timetable' },
  { code: P.ACADEMIC_YEAR_MANAGE, module: 'Academic', description: 'Manage academic years' },
  { code: P.CLASS_MANAGE, module: 'Academic', description: 'Manage classes and sections' },
  { code: P.SUBJECT_MANAGE, module: 'Academic', description: 'Manage subjects' },
  { code: P.TIMETABLE_MANAGE, module: 'Academic', description: 'Build and edit timetables' },

  { code: P.STUDENT_CREATE, module: 'Students', description: 'Admit new student' },
  { code: P.STUDENT_READ, module: 'Students', description: 'View student profiles' },
  { code: P.STUDENT_UPDATE, module: 'Students', description: 'Update student record' },
  { code: P.STUDENT_DELETE, module: 'Students', description: 'Archive/Delete student' },
  { code: P.ADMISSIONS_READ, module: 'Admissions', description: 'View admission enquiries' },
  { code: P.ADMISSIONS_MANAGE, module: 'Admissions', description: 'Manage admission pipeline' },

  { code: P.STAFF_CREATE, module: 'Staff', description: 'Add new employee/teacher' },
  { code: P.STAFF_READ, module: 'Staff', description: 'View staff directory' },
  { code: P.STAFF_UPDATE, module: 'Staff', description: 'Update staff record' },
  { code: P.STAFF_DELETE, module: 'Staff', description: 'Archive/Delete staff' },
  { code: P.STAFF_LEAVE_APPROVE, module: 'Staff', description: 'Approve/reject staff leave requests' },
  { code: P.STAFF_ATTENDANCE_MANAGE, module: 'Staff', description: 'Record staff attendance' },
  { code: P.PAYROLL_MANAGE, module: 'Staff', description: 'Generate and disburse payroll' },

  { code: P.ATTENDANCE_MARK, module: 'Attendance', description: 'Take class attendance' },
  { code: P.ATTENDANCE_READ, module: 'Attendance', description: 'View attendance analytics' },
  { code: P.ATTENDANCE_APPROVE_LEAVE, module: 'Attendance', description: 'Approve student leaves' },

  { code: P.HOMEWORK_READ, module: 'Homework', description: 'View homework' },
  { code: P.HOMEWORK_MANAGE, module: 'Homework', description: 'Assign and grade homework' },

  { code: P.FEE_STRUCTURE_MANAGE, module: 'Billing', description: 'Configure fee components' },
  { code: P.INVOICE_CREATE, module: 'Billing', description: 'Issue student invoices' },
  { code: P.INVOICE_READ, module: 'Billing', description: 'View fee ledger and invoices' },
  { code: P.PAYMENT_COLLECT, module: 'Billing', description: 'Collect and record fee payments' },
  { code: P.PAYMENT_REFUND, module: 'Billing', description: 'Process fee refunds' },

  { code: P.EXAM_READ, module: 'Examination', description: 'View exams and results' },
  { code: P.EXAM_CREATE, module: 'Examination', description: 'Create exams' },
  { code: P.MARKS_ENTRY, module: 'Examination', description: 'Enter subject marks' },
  { code: P.REPORT_CARD_GENERATE, module: 'Examination', description: 'Generate and publish report cards' },

  { code: P.NOTICE_READ, module: 'Communication', description: 'View notices' },
  { code: P.NOTICE_PUBLISH, module: 'Communication', description: 'Create and publish notices' },

  { code: P.OPERATIONS_READ, module: 'Operations', description: 'View visitors, infirmary, inventory and compliance' },
  { code: P.OPERATIONS_MANAGE, module: 'Operations', description: 'Manage visitors, infirmary, inventory and compliance' },

  { code: P.CALENDAR_MANAGE, module: 'Calendar', description: 'Manage holidays and school events' },

  { code: P.TRANSPORT_READ, module: 'Transport', description: 'View routes, vehicles and student transport' },
  { code: P.TRANSPORT_MANAGE, module: 'Transport', description: 'Manage routes, vehicles and assign students' },

  { code: P.LIBRARY_READ, module: 'Library', description: 'View library catalogue and issues' },
  { code: P.LIBRARY_MANAGE, module: 'Library', description: 'Manage books, issue and return' },

  { code: P.CERTIFICATE_ISSUE, module: 'Certificates', description: 'Issue certificates and ID cards' },

  { code: P.ROLES_MANAGE, module: 'Administration', description: 'Manage roles, permissions and user access' },
  { code: P.SETTINGS_MANAGE, module: 'Administration', description: 'Manage school settings' },
  { code: P.AUDIT_READ, module: 'Administration', description: 'View audit logs' },
];

// ADMIN is a super-role: the API guard always allows it, and it is also
// granted every catalogue permission so the UI shows the full set.
export const ADMIN_ROLE_CODE = 'ADMIN';

export const SYSTEM_ROLES: { code: string; name: string }[] = [
  { code: 'ADMIN', name: 'School Administrator' },
  { code: 'TEACHER', name: 'Teacher' },
  { code: 'ACCOUNTANT', name: 'Accountant' },
  { code: 'STAFF', name: 'Staff' },
  { code: 'STUDENT', name: 'Student' },
  { code: 'PARENT', name: 'Parent' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSION_CATALOGUE.map((p) => p.code),
  TEACHER: [
    P.ACADEMIC_READ,
    P.STUDENT_READ,
    P.STAFF_READ,
    P.ATTENDANCE_MARK,
    P.ATTENDANCE_READ,
    P.HOMEWORK_READ,
    P.HOMEWORK_MANAGE,
    P.EXAM_READ,
    P.MARKS_ENTRY,
    P.NOTICE_READ,
    P.LIBRARY_READ,
  ],
  ACCOUNTANT: [
    P.ACADEMIC_READ,
    P.STUDENT_READ,
    P.STAFF_READ,
    P.FEE_STRUCTURE_MANAGE,
    P.INVOICE_CREATE,
    P.INVOICE_READ,
    P.PAYMENT_COLLECT,
    P.PAYMENT_REFUND,
    P.PAYROLL_MANAGE,
    P.NOTICE_READ,
    P.TRANSPORT_READ,
  ],
  STAFF: [
    P.ACADEMIC_READ,
    P.STUDENT_READ,
    P.ADMISSIONS_READ,
    P.ADMISSIONS_MANAGE,
    P.OPERATIONS_READ,
    P.OPERATIONS_MANAGE,
    P.NOTICE_READ,
    P.TRANSPORT_READ,
    P.TRANSPORT_MANAGE,
    P.LIBRARY_READ,
    P.LIBRARY_MANAGE,
    P.CERTIFICATE_ISSUE,
  ],
  // Students and parents use the /portal API, which only returns their own
  // (or their children's) records. Staff-side read permissions such as
  // homework:read / exams:read must NOT be granted: those endpoints return
  // data for every student in the school.
  STUDENT: [P.ACADEMIC_READ, P.NOTICE_READ],
  PARENT: [P.ACADEMIC_READ, P.NOTICE_READ],
};

// Permissions that earlier versions granted by default but must be removed
// from these system roles on existing schools (applied by the seed script).
export const REVOKED_ROLE_PERMISSIONS: Record<string, string[]> = {
  STUDENT: [P.HOMEWORK_READ, P.EXAM_READ],
  PARENT: [P.HOMEWORK_READ, P.EXAM_READ],
};

// Node >= 23 require(esm): when an ES module has an export named "module.exports",
// require() returns that value instead of the module namespace. `export *` above
// re-exports the CommonJS Prisma client's own "module.exports", so on Node 23+
// require('@edurit/database') would return only the Prisma client and every
// export defined in this file (PERMISSIONS, prisma, ...) would be undefined.
// An explicit local export takes precedence over the star re-export.
const cjsExports = {
  ...prismaClientModule,
  prisma,
  PERMISSIONS,
  PERMISSION_CATALOGUE,
  ADMIN_ROLE_CODE,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  REVOKED_ROLE_PERMISSIONS,
};
export { cjsExports as 'module.exports' };
