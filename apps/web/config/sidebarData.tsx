import type { ReactNode } from "react";
import {
  AlertIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardIcon,
  CreditCardIcon,
  DashboardIcon,
  SettingsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from "@repo/ui/icons";
import { Building2, FileSpreadsheet, GraduationCap, Layers, ShieldCheck } from "lucide-react";
import { PERMISSIONS } from "@/lib/auth/permissions";

export interface SidebarItem {
  icon: ReactNode;
  label: string;
  url: string;
  // Hidden unless the user has this permission (admins see everything).
  permission?: string;
}

export interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

const icon = "w-6 h-6";

export const sidebarData: SidebarSection[] = [
  {
    section: "Overview",
    items: [{ icon: <DashboardIcon className={icon} />, label: "Dashboard", url: "/dashboard" }],
  },
  {
    section: "Academics",
    items: [
      { icon: <Layers className={icon} />, label: "Academic Setup", url: "/dashboard/academics", permission: PERMISSIONS.ACADEMIC_READ },
      { icon: <CalendarIcon className={icon} />, label: "Timetable", url: "/dashboard/timetable", permission: PERMISSIONS.ACADEMIC_READ },
      { icon: <BookOpenIcon className={icon} />, label: "Homework", url: "/dashboard/homework", permission: PERMISSIONS.HOMEWORK_READ },
      { icon: <FileSpreadsheet className={icon} />, label: "Exams & Marks", url: "/dashboard/exams", permission: PERMISSIONS.EXAM_READ },
      { icon: <AwardIcon className={icon} />, label: "Report Cards", url: "/dashboard/report-cards", permission: PERMISSIONS.EXAM_READ },
      { icon: <ClipboardIcon className={icon} />, label: "Desk Slips", url: "/dashboard/desk-slips", permission: PERMISSIONS.EXAM_READ },
    ],
  },
  {
    section: "Students",
    items: [
      { icon: <GraduationCap className={icon} />, label: "Students", url: "/dashboard/students", permission: PERMISSIONS.STUDENT_READ },
      { icon: <UserPlusIcon className={icon} />, label: "Admissions", url: "/dashboard/admissions", permission: PERMISSIONS.ADMISSIONS_READ },
      { icon: <UserCheckIcon className={icon} />, label: "Attendance", url: "/dashboard/attendance", permission: PERMISSIONS.ATTENDANCE_READ },
    ],
  },
  {
    section: "Finance",
    items: [
      { icon: <CreditCardIcon className={icon} />, label: "Fee Management", url: "/dashboard/fee-management", permission: PERMISSIONS.INVOICE_READ },
    ],
  },
  {
    section: "Staff & HR",
    items: [{ icon: <UsersIcon className={icon} />, label: "Staff & HR", url: "/dashboard/staff-hr", permission: PERMISSIONS.STAFF_READ }],
  },
  {
    section: "Engagement",
    items: [{ icon: <AlertIcon className={icon} />, label: "Notices", url: "/dashboard/notice", permission: PERMISSIONS.NOTICE_READ }],
  },
  {
    section: "Operations",
    items: [
      { icon: <Building2 className={icon} />, label: "Front Office", url: "/dashboard/operations", permission: PERMISSIONS.OPERATIONS_READ },
    ],
  },
  {
    section: "Administration",
    items: [
      { icon: <ShieldCheck className={icon} />, label: "Roles & Permissions", url: "/dashboard/roles-permissions", permission: PERMISSIONS.ROLES_MANAGE },
      { icon: <SettingsIcon className={icon} />, label: "Settings", url: "/dashboard/settings" },
    ],
  },
];

// Sections with the items this user may see; empty sections are dropped.
export const filterSidebar = (can: (...permissions: string[]) => boolean) =>
  sidebarData
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

// "/dashboard" only matches exactly; other items also match nested routes.
export const isSidebarItemActive = (pathname: string, url: string) =>
  url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

export const findSidebarLabel = (pathname: string) =>
  sidebarData.flatMap((s) => s.items).find((item) => isSidebarItemActive(pathname, item.url))?.label ?? "Dashboard";
