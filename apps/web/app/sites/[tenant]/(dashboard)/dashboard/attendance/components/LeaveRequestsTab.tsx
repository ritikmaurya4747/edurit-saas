"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  QueryState,
  Select,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, usePaginatedQuery } from "@/lib/api/hooks";
import { useSections, useStudentOptions } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, humanize } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { ATTENDANCE_INVALIDATE, schoolToday, type LeaveStatus, type StudentLeave } from "../types";

const STATUS_TONE: Record<LeaveStatus, BadgeTone> = { PENDING: "yellow", APPROVED: "green", REJECTED: "red" };

type Decision = { leave: StudentLeave; status: "APPROVED" | "REJECTED"; reason: string };
type NewLeave = { sectionId: string; studentId: string; startDate: string; endDate: string; reason: string };

const LeaveRequestsTab = () => {
  const can = useCan();
  const canApprove = can(PERMISSIONS.ATTENDANCE_APPROVE_LEAVE);
  const canCreate = can(PERMISSIONS.ATTENDANCE_MARK);
  const user = useUser();
  const today = schoolToday(user?.timezone);
  const sections = useSections();

  const [status, setStatus] = useState<LeaveStatus | "">("PENDING");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [form, setForm] = useState<NewLeave | null>(null);

  const leaves = usePaginatedQuery<StudentLeave>(["attendance", "leaves"], "student-leaves", {
    status: status || undefined,
    sectionId: sectionFilter || undefined,
    page,
    limit: 20,
  });
  const students = useStudentOptions(form?.sectionId ? form.sectionId : null);

  const decide = useApiMutation(
    (d: Decision) =>
      api.patch<StudentLeave>(`student-leaves/${d.leave.id}/status`, {
        status: d.status,
        actionReason: d.reason.trim() || undefined,
      }),
    {
      invalidate: ATTENDANCE_INVALIDATE,
      success: (l) => `Leave ${l.status === "APPROVED" ? "approved" : "rejected"}`,
      onSuccess: () => setDecision(null),
    },
  );

  const create = useApiMutation(
    (f: NewLeave) =>
      api.post<StudentLeave>("student-leaves", {
        studentId: f.studentId,
        startDate: f.startDate,
        endDate: f.endDate,
        reason: f.reason,
      }),
    { invalidate: ATTENDANCE_INVALIDATE, success: "Leave request recorded", onSuccess: () => setForm(null) },
  );

  const columns = useMemo<ColumnDef<StudentLeave>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-gray-900">{row.original.studentName}</div>
            <div className="text-xs text-gray-400">
              {row.original.sectionLabel ?? "—"} · {row.original.admissionNumber}
            </div>
          </div>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <div className="font-semibold text-gray-800">
              {formatDate(row.original.startDate)}
              {row.original.endDate !== row.original.startDate && ` – ${formatDate(row.original.endDate)}`}
            </div>
            <div className="text-xs text-gray-400">
              {row.original.days} day{row.original.days > 1 ? "s" : ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <div className="max-w-xs">
            <p className="line-clamp-2 text-gray-700">{row.original.reason}</p>
            {row.original.actionReason && (
              <p className="mt-1 text-xs text-gray-400">Note: {row.original.actionReason}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{humanize(row.original.status)}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canApprove && row.original.status === "PENDING" ? (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="success" onClick={() => setDecision({ leave: row.original, status: "APPROVED", reason: "" })}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" className="text-red-600" onClick={() => setDecision({ leave: row.original, status: "REJECTED", reason: "" })}>
                Reject
              </Button>
            </div>
          ) : null,
      },
    ],
    [canApprove],
  );

  const sectionOptions = (sections.data ?? []).map((s) => ({ value: s.id, label: s.label }));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:w-120">
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as LeaveStatus | "");
                setPage(1);
              }}
              placeholder="All requests"
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
          </Field>
          <Field label="Section">
            <Select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(1);
              }}
              placeholder="All sections"
              options={sectionOptions}
            />
          </Field>
        </div>
        {canCreate && (
          <Button
            onClick={() =>
              setForm({ sectionId: sectionFilter, studentId: "", startDate: today, endDate: today, reason: "" })
            }
          >
            <Plus className="h-4 w-4" /> New Leave
          </Button>
        )}
      </div>

      <QueryState
        isLoading={leaves.isLoading}
        error={leaves.error}
        onRetry={() => leaves.refetch()}
        isEmpty={!leaves.data?.data.length}
        empty={
          <EmptyState
            title={status === "PENDING" ? "No pending leave requests" : "No leave requests found"}
            description="Leave requests from parents or recorded by teachers appear here for approval."
            action={
              canCreate && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setForm({ sectionId: sectionFilter, studentId: "", startDate: today, endDate: today, reason: "" })
                  }
                >
                  Record a leave
                </Button>
              )
            }
          />
        }
      >
        <DataTable columns={columns} data={leaves.data?.data ?? []} />
        <Pagination meta={leaves.data?.meta} onPageChange={setPage} />
      </QueryState>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.status === "APPROVED" ? "Approve leave" : "Reject leave"}
        description={
          decision
            ? `${decision.leave.studentName} · ${formatDate(decision.leave.startDate)} – ${formatDate(decision.leave.endDate)}`
            : undefined
        }
        size="sm"
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
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{decision.leave.reason}</p>
            <Field label="Note to parent / teacher" hint="Optional">
              <Textarea
                value={decision.reason}
                maxLength={1000}
                onChange={(e) => setDecision({ ...decision, reason: e.target.value })}
                placeholder={decision.status === "REJECTED" ? "Why is this being rejected?" : "Any note"}
              />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title="New leave request"
        onSubmit={() => form && create.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending} disabled={!form?.studentId}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Section" required className="col-span-2 sm:col-span-1">
              <Select
                required
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value, studentId: "" })}
                placeholder="Select section"
                options={sectionOptions}
              />
            </Field>
            <Field
              label="Student"
              required
              className="col-span-2 sm:col-span-1"
              hint={form.sectionId && students.isLoading ? "Loading students…" : undefined}
            >
              <Select
                required
                disabled={!form.sectionId}
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder={form.sectionId ? "Select student" : "Pick a section first"}
                options={(students.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.rollNumber != null ? `${s.rollNumber}. ` : ""}${s.name}`,
                }))}
              />
            </Field>
            <Field label="From" required className="col-span-2 sm:col-span-1">
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                    endDate: form.endDate < e.target.value ? e.target.value : form.endDate,
                  })
                }
              />
            </Field>
            <Field label="To" required className="col-span-2 sm:col-span-1">
              <Input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
            <Field label="Reason" required className="col-span-2">
              <Textarea
                required
                maxLength={1000}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Fever, family function out of town"
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequestsTab;
