// src/common/constants/permissions.constant.ts

export enum PermissionCode {
  // ACADEMIC & BRANCH
  BRANCH_CREATE = 'branch:create',
  BRANCH_READ = 'branch:read',
  BRANCH_UPDATE = 'branch:update',
  BRANCH_DELETE = 'branch:delete',

  CLASS_MANAGE = 'class:manage',
  SUBJECT_MANAGE = 'subject:manage',

  // STUDENTS
  STUDENT_CREATE = 'students:create',
  STUDENT_READ = 'students:read',
  STUDENT_UPDATE = 'students:update',
  STUDENT_DELETE = 'students:delete',

  // STAFF
  STAFF_CREATE = 'staff:create',
  STAFF_READ = 'staff:read',
  STAFF_UPDATE = 'staff:update',
  STAFF_DELETE = 'staff:delete',

  // ATTENDANCE
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_APPROVE_LEAVE = 'attendance:approve_leave',

  // BILLING & FEES
  FEE_STRUCTURE_MANAGE = 'fees:structure_manage',
  INVOICE_CREATE = 'invoices:create',
  INVOICE_READ = 'invoices:read',
  PAYMENT_COLLECT = 'payments:collect',

  // EXAMS & MARKS
  EXAM_CREATE = 'exams:create',
  MARKS_ENTRY = 'marks:entry',
  REPORT_CARD_GENERATE = 'report_cards:generate',

  // NOTICES
  NOTICE_PUBLISH = 'notices:publish',
}