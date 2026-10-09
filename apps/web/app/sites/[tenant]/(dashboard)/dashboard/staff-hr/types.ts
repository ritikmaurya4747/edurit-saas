import type { Decimal } from "@/lib/api/types";

export type StaffStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
export type AppraisalStatus = "PENDING" | "COMPLETED";

export interface StaffItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  designation: string | null;
  department: string | null;
  specialization: string | null;
  joiningDate: string | null;
  // null when the viewer may not see salaries
  basicSalary: Decimal | null;
  status: StaffStatus;
  isTeachingStaff: boolean;
  branch: { id: string; name: string } | null;
  roles: { code: string; name: string }[];
  membershipStatus: "INVITED" | "ACTIVE" | "SUSPENDED" | null;
}

export interface MonthlyAttendance {
  month: number;
  year: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  onLeaveDays: number;
  workingDays: number;
  lossOfPayDays: number;
}

export interface StaffDetail extends StaffItem {
  userId: string;
  createdAt: string;
  isSelf: boolean;
  leaveSummary: {
    year: number;
    approvedDaysByType: Record<string, number>;
    totalApprovedDays: number;
    pendingCount: number;
  };
  attendanceSummary: MonthlyAttendance;
}

export interface StaffCreateResult extends StaffDetail {
  existingAccount: boolean;
  temporaryPassword?: string;
}

export interface RoleOption {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface LeaveItem {
  id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  actionReason: string | null;
  createdAt: string;
  isOwn: boolean;
}

export interface RosterRecord {
  id: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string | null;
}

export interface RosterRow {
  staffId: string;
  name: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  avatarUrl: string | null;
  record: RosterRecord | null;
  onLeave: boolean;
  leaveType: string | null;
}

export interface RosterResponse {
  date: string;
  isToday: boolean;
  staff: RosterRow[];
}

export interface AttendanceReportRow extends Omit<MonthlyAttendance, "month" | "year"> {
  staffId: string;
  name: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
}

export interface AttendanceReport {
  month: number;
  year: number;
  rows: AttendanceReportRow[];
}

export interface PayrollItem {
  id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  month: number;
  year: number;
  basicSalary: Decimal;
  allowances: Decimal;
  deductions: Decimal;
  netSalary: Decimal;
  isDisbursed: boolean;
  disbursedAt: string | null;
}

export interface PayrollResponse {
  month: number;
  year: number;
  records: PayrollItem[];
  totals: {
    gross: number;
    deductions: number;
    net: number;
    disbursed: number;
    pending: number;
    count: number;
    disbursedCount: number;
  };
}

export interface Payslip {
  id: string;
  school: { name: string; legalName: string | null; logoUrl: string | null; currency: string; branch: string | null };
  staff: {
    id: string;
    name: string;
    employeeCode: string;
    designation: string | null;
    department: string | null;
    joiningDate: string | null;
  };
  period: { month: number; year: number; label: string; daysInMonth: number };
  earnings: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  attendance: Omit<MonthlyAttendance, "month" | "year">;
  isDisbursed: boolean;
  disbursedAt: string | null;
}

export interface AppraisalItem {
  id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  period: string;
  rating: Decimal | null;
  remarks: string | null;
  status: AppraisalStatus;
  reviewedAt: string | null;
  createdAt: string;
}
