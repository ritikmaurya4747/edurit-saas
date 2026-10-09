"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge, Button, Modal, type BadgeTone } from "@/components/ui";
import type { AttendanceStatus, LeaveStatus, StaffStatus } from "../types";

// Query keys to refresh after any Staff & HR change.
export const STAFF_INVALIDATE = [["staff"], ["dashboard"]];

export const STAFF_STATUS_OPTIONS: { value: StaffStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
];

const staffTones: Record<StaffStatus, BadgeTone> = { ACTIVE: "green", ON_LEAVE: "yellow", RESIGNED: "gray", TERMINATED: "red" };
const leaveTones: Record<LeaveStatus, BadgeTone> = { PENDING: "orange", APPROVED: "green", REJECTED: "red" };
const attendanceTones: Record<AttendanceStatus, BadgeTone> = { PRESENT: "green", LATE: "orange", ABSENT: "red", EXCUSED: "blue" };

export const StaffStatusBadge = ({ status }: { status: StaffStatus }) => (
  <Badge tone={staffTones[status]}>{STAFF_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}</Badge>
);

export const LeaveStatusBadge = ({ status }: { status: LeaveStatus }) => (
  <Badge tone={leaveTones[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>
);

export const AttendanceBadge = ({ status }: { status: AttendanceStatus }) => (
  <Badge tone={attendanceTones[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>
);

export const LEAVE_TYPE_OPTIONS = [
  { value: "CASUAL", label: "Casual leave" },
  { value: "SICK", label: "Sick leave" },
  { value: "EARNED", label: "Earned leave" },
  { value: "MATERNITY", label: "Maternity leave" },
  { value: "PATERNITY", label: "Paternity leave" },
  { value: "UNPAID", label: "Unpaid leave" },
  { value: "OTHER", label: "Other" },
];

export const leaveTypeLabel = (type: string) => LEAVE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;

export const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
];

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(Date.UTC(2000, i, 1)).toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" }),
}));

export const yearOptions = () => {
  const y = new Date().getFullYear();
  return [y + 1, y, y - 1, y - 2, y - 3].map((v) => ({ value: String(v), label: String(v) }));
};

export const monthLabel = (month: number, year: number) =>
  `${MONTH_OPTIONS[month - 1]?.label ?? month} ${year}`;

// Name with a muted second line (designation / email / code).
export const PersonCell = ({ name, sub }: { name: string; sub?: string | null }) => (
  <div className="min-w-0">
    <p className="truncate font-bold text-gray-900">{name}</p>
    {sub && <p className="truncate text-xs text-gray-500">{sub}</p>}
  </div>
);

// Shows a one-time password with a copy button.
export function TemporaryPasswordModal({
  open,
  onClose,
  password,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  password: string;
  name?: string;
  email?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Temporary password"
      description="This password is shown only once. Share it securely — the staff member should change it after signing in."
      size="sm"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="space-y-3">
        {(name || email) && (
          <p className="text-sm text-gray-600">
            Login for <span className="font-bold text-gray-900">{name}</span>
            {email && <span className="block text-xs text-gray-500">{email}</span>}
          </p>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-[#FCFBF8] p-3">
          <code className="flex-1 break-all font-mono text-base font-bold tracking-wide text-gray-900">{password}</code>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
