"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { useBranches } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import ImportWizard from "../../../students/import/kit/ImportWizard";
import type { ImportColumn, ImportConfig } from "../../../students/import/kit/types";
import type { RoleOption } from "../../types";

// Used when GET /staff/roles is unavailable.
const FALLBACK_ROLES = ["Teacher", "Accountant", "Staff", "Admin"];

// Header row of the staff template (exact order). * = required.
// Employee Code | First Name* | Last Name | Email* | Mobile | Designation | Department | Role* |
// Teaching Staff | Joining Date | Basic Salary | Branch Code
function staffColumns(roleNames: string[], branchCodes: string[]): ImportColumn[] {
  return [
    {
      key: "employeeCode",
      header: "Employee Code",
      text: true,
      aliases: ["Emp Code", "Employee ID", "Emp ID", "Staff ID"],
      note: "Leave blank to auto-generate (EMP-0001). Letters, numbers, /, - and _ only.",
    },
    { key: "firstName", header: "First Name", required: true, example: "Anita", note: "Staff member's first name." },
    { key: "lastName", header: "Last Name", example: "Sharma", aliases: ["Surname"], note: "Surname (optional)." },
    {
      key: "email",
      header: "Email",
      required: true,
      example: "anita.sharma@example.com",
      width: 28,
      aliases: ["Email ID", "E-mail", "Login Email"],
      note: "Login id. New accounts get a temporary password; people already using EduRit at another school keep theirs.",
    },
    { key: "mobile", header: "Mobile", example: "9876543210", text: true, aliases: ["Phone", "Mobile No", "Contact"], note: "10-digit mobile (optional)." },
    { key: "designation", header: "Designation", example: "Senior Teacher", width: 18, note: "e.g. Senior Teacher, Clerk." },
    { key: "department", header: "Department", example: "Science", note: "e.g. Science, Accounts." },
    {
      key: "role",
      header: "Role",
      required: true,
      example: roleNames.find((r) => /teacher/i.test(r)) ?? "Teacher",
      list: roleNames,
      note: "Teacher, Accountant, Staff or Admin (Admin only when you are an administrator). Decides what they can access.",
    },
    {
      key: "teachingStaff",
      header: "Teaching Staff",
      example: "Yes",
      list: ["Yes", "No"],
      aliases: ["Teaching", "Is Teaching Staff"],
      note: "Yes / No. Blank = Yes for teachers, No for other roles.",
    },
    { key: "joiningDate", header: "Joining Date", date: true, example: "01-06-2024", width: 15, aliases: ["Date of Joining", "DOJ"], note: "DD-MM-YYYY (optional)." },
    { key: "basicSalary", header: "Basic Salary", example: "45000", aliases: ["Salary", "Basic"], note: "Monthly basic salary in numbers (optional)." },
    {
      key: "branchCode",
      header: "Branch Code",
      list: branchCodes,
      aliases: ["Branch"],
      note: `Optional. Blank = main branch.${branchCodes.length ? ` Codes: ${branchCodes.join(", ")}.` : ""}`,
    },
  ];
}

const INSTRUCTIONS = [
  "One staff member per row. Do not change, rename or reorder the header row; the example row (grey) is skipped automatically.",
  "Required: First Name, Email and Role. Each email can appear only once.",
  "Every new staff member gets a temporary password (shown once after the import) and must change it at first login.",
  "Dates as DD-MM-YYYY. Mobile numbers as 10 digits — +91, spaces and dashes are removed automatically.",
  "Up to 2,000 rows per file. Nothing is saved until you review the checks and click Import.",
];

const StaffImportPage = () => {
  const can = useCan();
  const user = useUser();
  const roles = useApiQuery<RoleOption[]>(["staff", "roles"], "staff/roles", undefined, { staleTime: 5 * 60_000 });
  const branches = useBranches();

  const config = useMemo<ImportConfig>(() => {
    const roleNames = (roles.data?.length ? roles.data.map((r) => (r.code === "ADMIN" ? "Admin" : r.name)) : FALLBACK_ROLES).filter(
      (name) => user?.isAdmin || name !== "Admin",
    );
    const branchCodes = (branches.data ?? []).map((b) => b.code);
    return {
      entity: "staff member",
      entityPlural: "staff",
      title: "Import Staff",
      description: "Add many teachers and employees at once from Excel or CSV — each gets a login",
      backHref: "/dashboard/staff-hr",
      backLabel: "Staff & HR",
      doneHref: "/dashboard/staff-hr",
      apiBase: "imports/staff",
      templateFileName: "staff-import-template",
      sheetName: "Staff",
      columns: staffColumns(roleNames, branchCodes),
      instructions: INSTRUCTIONS,
      exampleKeys: ["firstName", "lastName", "email"],
      templateLoading: roles.isLoading || branches.isLoading,
      options: [],
      validateOptions: (_o, ctx) => ({ precedingRows: ctx.precedingRows }),
      commitOptions: () => ({}),
      crossChecks: [
        {
          level: "error",
          key: (n) => (typeof n.email === "string" ? n.email : null),
          message: (n, first) => `Email ${String(n.email)} is repeated in the file (row ${first})`,
        },
        {
          level: "error",
          key: (n) => (typeof n.employeeCode === "string" && n.employeeCode ? n.employeeCode : null),
          message: (n, first) => `Employee Code ${String(n.employeeCode)} is repeated in the file (row ${first})`,
        },
      ],
      invalidate: [["staff"], ["students"], ["classes"], ["sections"], ["dashboard"]],
      credentialsTitle: "Login credentials — staff import",
      createdLabel: (c) => [c.name, c.employeeCode, c.email].filter(Boolean).join(" · "),
    };
  }, [roles.data, roles.isLoading, branches.data, branches.isLoading, user?.isAdmin]);

  if (!can(PERMISSIONS.STAFF_CREATE)) {
    return <EmptyState title="No access" description="You need permission to add staff to import them." />;
  }
  return <ImportWizard config={config} />;
};

export default StaffImportPage;
