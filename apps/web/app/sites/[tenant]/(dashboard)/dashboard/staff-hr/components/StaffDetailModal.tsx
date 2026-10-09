"use client";

import { useState, type ReactNode } from "react";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, Field, Modal, QueryState, Select, StatTile } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils/format";
import type { StaffDetail, StaffItem, StaffStatus } from "../types";
import {
  STAFF_INVALIDATE,
  STAFF_STATUS_OPTIONS,
  StaffStatusBadge,
  TemporaryPasswordModal,
  leaveTypeLabel,
  monthLabel,
} from "./shared";

const Info = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    <div className="mt-0.5 text-sm font-semibold text-gray-800">{children || "—"}</div>
  </div>
);

interface Props {
  staffId: string;
  onClose: () => void;
  onEdit: (staff: StaffItem) => void;
}

export default function StaffDetailModal({ staffId, onClose, onEdit }: Props) {
  const can = useCan();
  const user = useUser();
  const detail = useApiQuery<StaffDetail>(["staff", "detail", staffId], `staff/${staffId}`);
  const staff = detail.data;

  const [statusDraft, setStatusDraft] = useState<StaffStatus | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const changeStatus = useApiMutation((status: StaffStatus) => api.post(`staff/${staffId}/status`, { status }), {
    invalidate: STAFF_INVALIDATE,
    success: "Status updated",
    onSuccess: () => setStatusDraft(null),
  });
  const resetPassword = useApiMutation(() => api.post<{ temporaryPassword: string }>(`staff/${staffId}/reset-password`), {
    success: "New password generated",
    onSuccess: (r) => {
      setConfirmReset(false);
      setTempPassword(r.temporaryPassword);
    },
  });
  const remove = useApiMutation(() => api.delete(`staff/${staffId}`), {
    invalidate: STAFF_INVALIDATE,
    success: "Staff member removed",
    onSuccess: () => {
      setConfirmDelete(false);
      onClose();
    },
  });

  const canUpdate = can(PERMISSIONS.STAFF_UPDATE);
  const canDelete = can(PERMISSIONS.STAFF_DELETE);
  const isSelf = !!staff?.isSelf;
  const currency = user?.currency ?? "INR";
  const leaving = statusDraft === "RESIGNED" || statusDraft === "TERMINATED";

  return (
    <>
      <Modal open onClose={onClose} size="xl" title={staff?.name ?? "Staff profile"} description={staff ? `${staff.employeeCode} · ${staff.designation ?? "Staff"}` : undefined}>
        <QueryState isLoading={detail.isLoading} error={detail.error} onRetry={() => detail.refetch()}>
          {staff && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C263A] text-sm font-bold text-white">
                    {getInitials(staff.name)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StaffStatusBadge status={staff.status} />
                      {staff.roles.map((r) => (
                        <Badge key={r.code} tone="purple">
                          {r.name}
                        </Badge>
                      ))}
                      {staff.membershipStatus === "SUSPENDED" && <Badge tone="red">Login suspended</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{staff.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canUpdate && (
                    <Button variant="secondary" size="sm" onClick={() => onEdit(staff)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {canUpdate && (
                    <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
                      <KeyRound className="h-3.5 w-3.5" /> Reset password
                    </Button>
                  )}
                  {canDelete && !isSelf && (
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-[#FCFBF8] p-4 sm:grid-cols-3 lg:grid-cols-4">
                <Info label="Phone">{staff.phone}</Info>
                <Info label="Department">{staff.department}</Info>
                <Info label="Designation">{staff.designation}</Info>
                <Info label="Type">{staff.isTeachingStaff ? "Teaching" : "Non-teaching"}</Info>
                <Info label="Specialization">{staff.specialization}</Info>
                <Info label="Branch">{staff.branch?.name}</Info>
                <Info label="Joining date">{formatDate(staff.joiningDate)}</Info>
                {staff.basicSalary != null && <Info label="Basic salary">{formatCurrency(staff.basicSalary, currency)}</Info>}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-gray-900">
                  Attendance · {monthLabel(staff.attendanceSummary.month, staff.attendanceSummary.year)}
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatTile label="Present" value={staff.attendanceSummary.present} tone="success" />
                  <StatTile label="Late" value={staff.attendanceSummary.late} tone="warning" />
                  <StatTile label="Absent" value={staff.attendanceSummary.absent} tone={staff.attendanceSummary.absent ? "danger" : "default"} />
                  <StatTile label="On leave" value={staff.attendanceSummary.onLeaveDays} />
                  <StatTile label="Working days" value={staff.attendanceSummary.workingDays} hint="Mon–Sat so far" />
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-gray-900">Leave · {staff.leaveSummary.year}</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(staff.leaveSummary.approvedDaysByType).map(([type, days]) => (
                    <Badge key={type} tone="blue">
                      {leaveTypeLabel(type)}: {days} day{days === 1 ? "" : "s"}
                    </Badge>
                  ))}
                  {!Object.keys(staff.leaveSummary.approvedDaysByType).length && (
                    <span className="text-sm text-gray-500">No approved leave this year.</span>
                  )}
                  {staff.leaveSummary.pendingCount > 0 && (
                    <Badge tone="orange">{staff.leaveSummary.pendingCount} pending request(s)</Badge>
                  )}
                </div>
              </div>

              {canUpdate && !isSelf && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <h4 className="mb-3 text-sm font-bold text-gray-900">Employment status</h4>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Field label="Change status to" className="sm:w-64">
                      <Select
                        value={statusDraft ?? staff.status}
                        onChange={(e) => setStatusDraft(e.target.value as StaffStatus)}
                        options={STAFF_STATUS_OPTIONS}
                      />
                    </Field>
                    <Button
                      variant={leaving ? "danger" : "primary"}
                      disabled={!statusDraft || statusDraft === staff.status}
                      loading={changeStatus.isPending}
                      onClick={() => statusDraft && changeStatus.mutate(statusDraft)}
                    >
                      Update status
                    </Button>
                  </div>
                  {leaving && (
                    <p className="mt-2 text-xs text-red-600">Resigned or terminated staff can no longer sign in to the ERP.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </QueryState>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => resetPassword.mutate()}
        loading={resetPassword.isPending}
        tone="primary"
        title="Reset password?"
        message={`A new temporary password will be generated for ${staff?.name}. Their current password stops working immediately.`}
        confirmLabel="Generate password"
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title={`Remove ${staff?.name}?`}
        message="The staff profile is archived and their login to this school is suspended. Attendance, leave and payroll history is kept."
        confirmLabel="Remove"
      />
      {tempPassword && (
        <TemporaryPasswordModal
          open
          onClose={() => setTempPassword(null)}
          password={tempPassword}
          name={staff?.name}
          email={staff?.email}
        />
      )}
    </>
  );
}
