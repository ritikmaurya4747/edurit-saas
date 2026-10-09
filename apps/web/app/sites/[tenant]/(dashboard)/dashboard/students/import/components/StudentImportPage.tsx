"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/ui";
import { useClasses } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import ImportWizard from "../kit/ImportWizard";
import type { ImportColumn, ImportConfig } from "../kit/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Header row of the student template (exact order). * = required.
// Admission No | First Name* | Last Name | Gender* | Date of Birth* | Class* | Section* | Roll No | Blood Group |
// Student Mobile | Student Email | Address | Admission Date | Father Name | Father Mobile | Father Email |
// Mother Name | Mother Mobile | Mother Email
function studentColumns(classNames: string[], sectionNames: string[]): ImportColumn[] {
  const exampleClass = classNames[0] ?? "Class 5";
  const exampleSection = sectionNames[0] ?? "A";
  return [
    {
      key: "admissionNo",
      header: "Admission No",
      text: true,
      aliases: ["Admission Number", "Adm No", "Adm. No", "Admission ID", "Scholar No", "SR No"],
      note: "Leave blank to auto-generate (ADM-YYYY-0001). Must be unique in the school.",
    },
    { key: "firstName", header: "First Name", required: true, example: "Aarav", aliases: ["Student First Name", "Name"], note: "Student's first name." },
    { key: "lastName", header: "Last Name", example: "Sharma", aliases: ["Surname", "Student Last Name"], note: "Surname (optional)." },
    {
      key: "gender",
      header: "Gender",
      required: true,
      example: "Male",
      list: ["Male", "Female", "Other"],
      aliases: ["Sex"],
      note: "Male, Female or Other (M / F / Boy / Girl are also accepted).",
    },
    {
      key: "dob",
      header: "Date of Birth",
      required: true,
      example: "15-06-2014",
      date: true,
      width: 15,
      aliases: ["DOB", "Birth Date", "Date Of Birth (DD-MM-YYYY)"],
      note: "DD-MM-YYYY (e.g. 15-06-2014) or an Excel date. Cannot be in the future.",
    },
    {
      key: "className",
      header: "Class",
      required: true,
      example: exampleClass,
      list: classNames,
      aliases: ["Class Name", "Grade", "Standard", "Std"],
      note: "Class name or code as in Academic Setup (e.g. Class 5, 5, V).",
    },
    {
      key: "section",
      header: "Section",
      required: true,
      example: exampleSection,
      list: sectionNames,
      aliases: ["Section Name", "Division", "Div"],
      note: "Section of that class (e.g. A).",
    },
    {
      key: "rollNo",
      header: "Roll No",
      example: "1",
      aliases: ["Roll Number", "Roll"],
      note: "Optional. Blank = next free roll number in the section.",
    },
    { key: "bloodGroup", header: "Blood Group", list: BLOOD_GROUPS, example: "B+", note: "A+, A-, B+, B-, AB+, AB-, O+ or O-." },
    { key: "studentMobile", header: "Student Mobile", text: true, aliases: ["Mobile", "Student Phone"], note: "10-digit mobile (optional)." },
    { key: "studentEmail", header: "Student Email", width: 24, aliases: ["Email", "Student E-mail"], note: "Optional." },
    { key: "address", header: "Address", width: 32, example: "12 MG Road, Pune", note: "Residential address (optional)." },
    {
      key: "admissionDate",
      header: "Admission Date",
      date: true,
      width: 15,
      aliases: ["Date of Admission", "DOA"],
      note: "DD-MM-YYYY. Blank = today.",
    },
    {
      key: "fatherName",
      header: "Father Name",
      example: "Rakesh Sharma",
      width: 20,
      aliases: ["Father's Name", "Father Full Name"],
      note: "Full name. Father or mother (name + mobile) is required.",
    },
    {
      key: "fatherMobile",
      header: "Father Mobile",
      example: "9876543210",
      text: true,
      aliases: ["Father's Mobile", "Father Phone", "Father Mobile No", "Father Contact"],
      note: "10-digit mobile. Parents log in with it; brothers/sisters with the same number share one parent login.",
    },
    { key: "fatherEmail", header: "Father Email", width: 24, aliases: ["Father's Email"], note: "Optional." },
    { key: "motherName", header: "Mother Name", example: "Sunita Sharma", width: 20, aliases: ["Mother's Name"], note: "Full name." },
    {
      key: "motherMobile",
      header: "Mother Mobile",
      example: "9876501234",
      text: true,
      aliases: ["Mother's Mobile", "Mother Phone", "Mother Mobile No", "Mother Contact"],
      note: "10-digit mobile.",
    },
    { key: "motherEmail", header: "Mother Email", width: 24, aliases: ["Mother's Email"], note: "Optional." },
  ];
}

const INSTRUCTIONS = [
  "One student per row. Do not change, rename or reorder the header row; the example row (grey) is skipped automatically.",
  "Required: First Name, Gender, Date of Birth, Class, Section and at least one parent (Father or Mother) with a 10-digit mobile number.",
  "Dates as DD-MM-YYYY (e.g. 15-06-2014). Mobile numbers as 10 digits — +91, spaces and dashes are removed automatically.",
  "Class and Section must match Academic Setup (or tick “Create missing classes/sections” during review).",
  "Brothers and sisters with the same parent mobile number are linked to ONE parent login.",
  "Up to 2,000 students per file. Nothing is saved until you review the checks and click Import.",
];

const StudentImportPage = () => {
  const can = useCan();
  const classes = useClasses();
  const canManageClasses = can(PERMISSIONS.CLASS_MANAGE);

  const config = useMemo<ImportConfig>(() => {
    const list = classes.data ?? [];
    const classNames = list.map((c) => c.name).sort(naturalSort);
    const sectionNames = [...new Set(list.flatMap((c) => c.sections.map((s) => s.name)))].sort(naturalSort);
    return {
      entity: "student",
      entityPlural: "students",
      title: "Import Students",
      description: "Admit many students at once from Excel or CSV — with parents and portal logins",
      backHref: "/dashboard/students",
      backLabel: "All students",
      doneHref: "/dashboard/students",
      apiBase: "imports/students",
      templateFileName: "student-import-template",
      sheetName: "Students",
      columns: studentColumns(classNames, sectionNames),
      instructions: INSTRUCTIONS,
      exampleKeys: ["firstName", "lastName", "fatherMobile"],
      templateLoading: classes.isLoading,
      options: [
        ...(canManageClasses
          ? [
              {
                key: "createMissingClasses",
                label: "Create missing classes / sections",
                hint: "Classes or sections in the file that are not in Academic Setup are created (capacity sized to the file, minimum 40).",
                defaultValue: false,
                revalidate: true,
              },
            ]
          : []),
        {
          key: "createParentLogins",
          label: "Create parent logins",
          hint: "Each parent gets a temporary password and signs in with their mobile number. Parents who already have a login keep it.",
          defaultValue: true,
        },
        {
          key: "createStudentLogins",
          label: "Create student logins",
          hint: "Students sign in with their admission number and a temporary password.",
          defaultValue: false,
        },
      ],
      validateOptions: (o, ctx) => ({
        createMissingClasses: !!o.createMissingClasses,
        precedingRows: ctx.precedingRows,
        sectionCounts: ctx.groupCounts,
      }),
      commitOptions: (o, ctx) => ({
        createMissingClasses: !!o.createMissingClasses,
        createStudentLogins: !!o.createStudentLogins,
        createParentLogins: !!o.createParentLogins,
        sectionCounts: ctx.groupCounts,
      }),
      groupKey: "sectionKey",
      crossChecks: [
        {
          level: "error",
          key: (n) => (typeof n.admissionNumber === "string" && n.admissionNumber ? n.admissionNumber.toLowerCase() : null),
          message: (n, first) => `Admission No ${String(n.admissionNumber)} is repeated in the file (row ${first})`,
        },
        {
          level: "error",
          key: (n) => (n.rollNumber != null ? `${String(n.sectionKey)}#${String(n.rollNumber)}` : null),
          message: (n, first) => `Roll No ${String(n.rollNumber)} is repeated for ${String(n.classLabel)} in the file (row ${first})`,
        },
        {
          level: "warning",
          key: (n) => `${String(n.name).toLowerCase()}#${String(n.dob)}`,
          message: (_n, first) => `Same name and date of birth as row ${first} — is this the same student twice?`,
        },
      ],
      // Explicit roll numbers first so auto-numbered students never take them.
      commitPriority: (row) => (row.values.rollNo ? 0 : 1),
      invalidate: [["students"], ["staff"], ["classes"], ["sections"], ["dashboard"]],
      credentialsTitle: "Login credentials — student import",
      createdLabel: (c) => [c.name, c.admissionNumber, c.classLabel].filter(Boolean).join(" · "),
    };
  }, [classes.data, classes.isLoading, canManageClasses]);

  if (!can(PERMISSIONS.STUDENT_CREATE)) {
    return <EmptyState title="No access" description="You need permission to admit students to import them." />;
  }
  return <ImportWizard config={config} />;
};

export default StudentImportPage;
