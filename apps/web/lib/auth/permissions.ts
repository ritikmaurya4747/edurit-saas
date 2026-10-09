"use client";

import { useCallback } from "react";
import { useUser } from "@/providers/user-provider";

// Mirrors PERMISSIONS in packages/database/src/rbac.ts (the API enforces them;
// the UI only uses them to hide actions the user cannot perform).
export const PERMISSIONS = {
  BRANCH_CREATE: "branch:create",
  BRANCH_UPDATE: "branch:update",
  BRANCH_DELETE: "branch:delete",
  ACADEMIC_READ: "academic:read",
  ACADEMIC_YEAR_MANAGE: "academic_year:manage",
  CLASS_MANAGE: "class:manage",
  SUBJECT_MANAGE: "subject:manage",
  TIMETABLE_MANAGE: "timetable:manage",
  STUDENT_CREATE: "students:create",
  STUDENT_READ: "students:read",
  STUDENT_UPDATE: "students:update",
  STUDENT_DELETE: "students:delete",
  ADMISSIONS_READ: "admissions:read",
  ADMISSIONS_MANAGE: "admissions:manage",
  STAFF_CREATE: "staff:create",
  STAFF_READ: "staff:read",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete",
  STAFF_LEAVE_APPROVE: "staff_leave:approve",
  STAFF_ATTENDANCE_MANAGE: "staff_attendance:manage",
  PAYROLL_MANAGE: "payroll:manage",
  ATTENDANCE_MARK: "attendance:mark",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_APPROVE_LEAVE: "attendance:approve_leave",
  HOMEWORK_READ: "homework:read",
  HOMEWORK_MANAGE: "homework:manage",
  FEE_STRUCTURE_MANAGE: "fees:structure_manage",
  INVOICE_CREATE: "invoices:create",
  INVOICE_READ: "invoices:read",
  PAYMENT_COLLECT: "payments:collect",
  PAYMENT_REFUND: "payments:refund",
  EXAM_READ: "exams:read",
  EXAM_CREATE: "exams:create",
  MARKS_ENTRY: "marks:entry",
  REPORT_CARD_GENERATE: "report_cards:generate",
  NOTICE_READ: "notices:read",
  NOTICE_PUBLISH: "notices:publish",
  OPERATIONS_READ: "operations:read",
  OPERATIONS_MANAGE: "operations:manage",
  ROLES_MANAGE: "roles:manage",
  SETTINGS_MANAGE: "settings:manage",
  AUDIT_READ: "audit:read",
} as const;

// const can = useCan(); can(PERMISSIONS.STUDENT_CREATE) → boolean
// Several codes = all required. Admins can do everything.
export function useCan() {
  const user = useUser();
  return useCallback(
    (...permissions: string[]) =>
      !!user && (user.isAdmin || permissions.every((p) => user.permissions?.includes(p))),
    [user],
  );
}
