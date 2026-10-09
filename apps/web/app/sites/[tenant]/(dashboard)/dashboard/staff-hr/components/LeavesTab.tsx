"use client";

import { useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Button, ConfirmDialog, EmptyState, Field, Input, Modal, Pagination, QueryState, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, usePaginatedQuery } from "@/lib/api/hooks";
import { useStaffOptions } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatDate, todayInput } from "@/lib/utils/format";
import type { LeaveItem } from "../types";
import { LEAVE_TYPE_OPTIONS, LeaveStatusBadge, PersonCell, STAFF_INVALIDATE, leaveTypeLabel } from "./shared";

type ApplyForm = { staffId: string; leaveType: string; startDate: string; endDate: string; reason: string };
type Decision = { leave: LeaveItem; status: "APPROVED" | "REJECTED"; actionReason: string };

const STATUS_FILTERS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function LeavesTab() {
  const can = useCan();
  const user = useUser();
  const canApprove = can(PERMISSIONS.STAFF_LEAVE_APPROVE);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [apply, setApply] = useState<ApplyForm | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [toCancel, setToCancel] = useState<LeaveItem | null>(null);

  const leaves = usePaginatedQuery<LeaveItem>(["staff", "leaves"], "staff-leaves", { page, limit: 20, status });
  const staffOptions = useStaffOptions();

  const applyLeave = useApiMutation(
    (f: ApplyForm) =>
      api.post("staff-leaves", {
        staffId: f.staffId || undefined,
        leaveType: f.leaveType,
        startDate: f.startDate,
        endDate: f.endDate,
        reason: f.reason.trim(),
      }),
    { invalidate: STAFF_INVALIDATE, success: "Leave request submitted", onSuccess: () => setApply(null) },
  );
  const decide = useApiMutation(
    (d: Decision) => api.patch<LeaveItem>(`staff-leaves/${d.leave.id}/status`, { status: d.status, actionReason: d.actionReason.trim() || undefined }),
    {
      invalidate: STAFF_INVALIDATE,
      success: (r) => (r?.status === "APPROVED" ? "Leave approved" : "Leave rejected"),
      onSuccess: () => setDecision(null),
    },
  );
  const cancel = useApiMutation((id: string) => api.delete(`staff-leaves/${id}`), {
    invalidate: STAFF_INVALIDATE,
    success: "Leave request cancelled",
    onSuccess: () => setToCancel(null),
  });

  const openApply = () => setApply({ staffId: "", leaveType: "CASUAL", startDate: todayInput(), endDate: todayInput(), reason: "" });

  const columns = useMemo<ColumnDef<LeaveItem>[]>(
    () => [
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) => (
          <PersonCell name={row.original.staffName} sub={[row.original.employeeCode, row.original.designation].filter(Boolean).join(" · ")} />
        ),
      },
      { accessorKey: "leaveType", header: "Type", cell: ({ row }) => <span className="font-medium text-gray-800">{leaveTypeLabel(row.original.leaveType)}</span> },
      {
        id: "dates",
        header: "Duration",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="text-gray-800">
              {formatDate(row.original.startDate)}
              {row.original.endDate !== row.original.startDate && ` – ${formatDate(row.original.endDate)}`}
            </p>
            <p className="text-xs text-gray-400">
              {row.original.days} day{row.original.days === 1 ? "" : "s"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => <p className="max-w-[260px] truncate text-gray-600" title={row.original.reason}>{row.original.reason}</p>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div>
            <LeaveStatusBadge status={row.original.status} />
            {row.original.actionReason && (
              <p className="mt-1 max-w-[200px] truncate text-xs text-gray-400" title={row.original.actionReason}>
                {row.original.actionReason}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const l = row.original;
          if (l.status !== "PENDING") return <span className="text-xs text-gray-400">Processed</span>;
          const mayDecide = canApprove && (!l.isOwn || user?.isAdmin);
          const mayCancel = l.isOwn || canApprove;
          return (
            <div className="flex flex-wrap gap-2">
              {mayDecide && (
                <>
                  <Button variant="success" size="sm" onClick={() => setDecision({ leave: l, status: "APPROVED", actionReason: "" })}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDecision({ leave: l, status: "REJECTED", actionReason: "" })}>
                    Reject
                  </Button>
                </>
              )}
              {mayCancel && (
                <Button variant="ghost" size="sm" onClick={() => setToCancel(l)}>
                  Cancel
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canApprove, user?.isAdmin],
  );

  const invalidRange = !!apply && apply.endDate < apply.startDate;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          className="sm:w-56"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          placeholder="All requests"
          options={STATUS_FILTERS}
        />
        <Button onClick={openApply}>
          <CalendarPlus className="h-4 w-4" /> Apply leave
        </Button>
      </div>

      {!canApprove && <p className="mb-3 text-xs text-gray-500">You are viewing your own leave requests.</p>}

      <QueryState
        isLoading={leaves.isLoading}
        error={leaves.error}
        onRetry={() => leaves.refetch()}
        isEmpty={!leaves.data?.data.length}
        empty={
          <EmptyState
            title={status ? "No leave requests with this status" : "No leave requests yet"}
            description="Leave applications and their approval status will appear here."
            action={<Button variant="secondary" onClick={openApply}>Apply leave</Button>}
          />
        }
      >
        <DataTable columns={columns} data={leaves.data?.data ?? []} />
        <Pagination meta={leaves.data?.meta} onPageChange={setPage} />
      </QueryState>

      <Modal
        open={!!apply}
        onClose={() => setApply(null)}
        title="Apply for leave"
        onSubmit={() => apply && !invalidRange && applyLeave.mutate(apply)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApply(null)} disabled={applyLeave.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={applyLeave.isPending} disabled={invalidRange}>
              Submit request
            </Button>
          </>
        }
      >
        {apply && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {canApprove && (
              <Field label="Staff member" className="sm:col-span-2" hint="Leave blank to apply for yourself">
                <Select
                  value={apply.staffId}
                  onChange={(e) => setApply({ ...apply, staffId: e.target.value })}
                  placeholder="Myself"
                  options={(staffOptions.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.employeeCode})` }))}
                />
              </Field>
            )}
            <Field label="Leave type" required className="sm:col-span-2">
              <Select required value={apply.leaveType} onChange={(e) => setApply({ ...apply, leaveType: e.target.value })} options={LEAVE_TYPE_OPTIONS} />
            </Field>
            <Field label="From" required>
              <Input type="date" required value={apply.startDate} onChange={(e) => setApply({ ...apply, startDate: e.target.value })} />
            </Field>
            <Field label="To" required error={invalidRange ? "End date cannot be before the start date" : undefined}>
              <Input type="date" required min={apply.startDate} value={apply.endDate} onChange={(e) => setApply({ ...apply, endDate: e.target.value })} />
            </Field>
            <Field label="Reason" required className="sm:col-span-2">
              <Textarea required maxLength={2000} value={apply.reason} onChange={(e) => setApply({ ...apply, reason: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        size="sm"
        title={decision?.status === "APPROVED" ? "Approve leave" : "Reject leave"}
        description={
          decision
            ? `${decision.leave.staffName} · ${leaveTypeLabel(decision.leave.leaveType)} · ${decision.leave.days} day${decision.leave.days === 1 ? "" : "s"}`
            : undefined
        }
        onSubmit={() => decision && decide.mutate(decision)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant={decision?.status === "APPROVED" ? "success" : "danger"} loading={decide.isPending}>
              {decision?.status === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
        {decision && (
          <div className="space-y-3">
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{decision.leave.reason}</p>
            <Field label={decision.status === "REJECTED" ? "Reason for rejection" : "Note (optional)"} required={decision.status === "REJECTED"}>
              <Textarea
                required={decision.status === "REJECTED"}
                maxLength={2000}
                value={decision.actionReason}
                onChange={(e) => setDecision({ ...decision, actionReason: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id)}
        loading={cancel.isPending}
        title="Cancel leave request?"
        message={toCancel ? `${toCancel.staffName}'s ${leaveTypeLabel(toCancel.leaveType).toLowerCase()} request will be withdrawn.` : ""}
        confirmLabel="Cancel request"
      />
    </div>
  );
}
