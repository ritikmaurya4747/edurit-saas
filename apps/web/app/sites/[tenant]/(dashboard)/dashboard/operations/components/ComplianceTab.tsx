"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  QueryState,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, humanize, toDateInput, todayInput } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  COMPLIANCE_STATUS_OPTIONS,
  COMPLIANCE_STATUS_TONE,
  COMPLIANCE_TYPES,
  OPS_KEYS,
  type ComplianceRecord,
  type ComplianceStatus,
} from "./types";

type RecordForm = {
  id?: string;
  title: string;
  complianceType: string;
  dueDate: string;
  documentUrl: string;
  status: ComplianceStatus;
};

const DUE_SOON_DAYS = 30;
const TYPE_OPTIONS = COMPLIANCE_TYPES.map((t) => ({ value: t, label: humanize(t) }));
const isHttpUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

const dueLabel = (r: ComplianceRecord) => {
  if (r.status === "COMPLIANT") return null;
  if (r.daysUntilDue < 0) return { text: `Overdue by ${-r.daysUntilDue} day${r.daysUntilDue === -1 ? "" : "s"}`, cls: "text-red-600" };
  if (r.daysUntilDue === 0) return { text: "Due today", cls: "text-amber-600" };
  if (r.daysUntilDue <= DUE_SOON_DAYS) return { text: `Due in ${r.daysUntilDue} day${r.daysUntilDue === 1 ? "" : "s"}`, cls: "text-amber-600" };
  return null;
};

const ComplianceTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.OPERATIONS_MANAGE);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [dueSoon, setDueSoon] = useState(false);
  const [form, setForm] = useState<RecordForm | null>(null);
  const [toDelete, setToDelete] = useState<ComplianceRecord | null>(null);

  const records = useApiQuery<ComplianceRecord[]>(["operations", "compliance"], "compliance", {
    status: status || undefined,
    complianceType: type || undefined,
    dueWithinDays: dueSoon ? DUE_SOON_DAYS : undefined,
  });

  const save = useApiMutation(
    ({ id, documentUrl, ...rest }: RecordForm) => {
      const body = { ...rest, title: rest.title.trim(), complianceType: rest.complianceType.trim(), documentUrl: documentUrl.trim() || null };
      return id ? api.patch(`compliance/${id}`, body) : api.post("compliance", body);
    },
    { invalidate: OPS_KEYS, success: "Compliance record saved", onSuccess: () => setForm(null) },
  );
  const changeStatus = useApiMutation(
    ({ id, status }: { id: string; status: ComplianceStatus }) => api.patch(`compliance/${id}`, { status }),
    { invalidate: OPS_KEYS, success: "Status updated" },
  );
  const remove = useApiMutation((id: string) => api.delete(`compliance/${id}`), {
    invalidate: OPS_KEYS,
    success: "Compliance record deleted",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<ComplianceRecord>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Requirement",
        cell: ({ row }) => (
          <div className="flex min-w-48 flex-col">
            <span className="font-bold text-gray-900">{row.original.title}</span>
            {isHttpUrl(row.original.documentUrl) ? (
              <a
                href={row.original.documentUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#1C263A] hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> View document
              </a>
            ) : (
              <span className="text-xs text-gray-400">No document</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "complianceType",
        header: "Type",
        cell: ({ row }) => (
          <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
            {humanize(row.original.complianceType)}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        cell: ({ row }) => {
          const due = dueLabel(row.original);
          return (
            <div className="flex flex-col whitespace-nowrap">
              <span className={cn("font-semibold", due?.cls ?? "text-gray-800")}>{formatDate(row.original.dueDate)}</span>
              {due && <span className={cn("text-xs font-semibold", due.cls)}>{due.text}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          canManage ? (
            <Select
              aria-label="Change status"
              className="w-36 py-1.5 text-xs font-semibold"
              value={row.original.status}
              options={COMPLIANCE_STATUS_OPTIONS}
              disabled={changeStatus.isPending && changeStatus.variables?.id === row.original.id}
              onChange={(e) => changeStatus.mutate({ id: row.original.id, status: e.target.value as ComplianceStatus })}
            />
          ) : (
            <Badge tone={COMPLIANCE_STATUS_TONE[row.original.status] ?? "gray"}>{humanize(row.original.status)}</Badge>
          ),
      },
      {
        id: "flag",
        header: "",
        cell: ({ row }) =>
          row.original.isOverdue ? <Badge tone="red">Overdue</Badge> : row.original.status === "COMPLIANT" ? <Badge tone="green">OK</Badge> : null,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Edit"
                onClick={() =>
                  setForm({
                    id: row.original.id,
                    title: row.original.title,
                    complianceType: row.original.complianceType,
                    dueDate: toDateInput(row.original.dueDate),
                    documentUrl: row.original.documentUrl ?? "",
                    status: row.original.status,
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => setToDelete(row.original)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManage, changeStatus],
  );

  const rows = records.data ?? [];
  const hasFilters = !!(status || type || dueSoon);
  const openCreate = () => setForm({ title: "", complianceType: "FIRE_SAFETY", dueDate: todayInput(), documentUrl: "", status: "PENDING" });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[170px_200px_auto] sm:items-center">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={COMPLIANCE_STATUS_OPTIONS} placeholder="All statuses" aria-label="Filter by status" />
          <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} placeholder="All types" aria-label="Filter by type" />
          <Checkbox label={`Due within ${DUE_SOON_DAYS} days`} checked={dueSoon} onChange={setDueSoon} />
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add record
          </Button>
        )}
      </div>

      <QueryState
        isLoading={records.isLoading}
        error={records.error}
        onRetry={() => records.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No records match" : "No compliance records yet"}
            description={
              hasFilters
                ? "Try different filters."
                : "Track fire NOCs, building safety, affiliation renewals, transport fitness and more with due-date alerts."
            }
            action={
              !hasFilters && canManage ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add record
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit compliance record" : "Add compliance record"}
        size="md"
        onSubmit={() => form && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" required className="sm:col-span-2">
              <Input
                required
                maxLength={255}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Fire NOC renewal"
                autoFocus
              />
            </Field>
            <Field label="Type" required hint="Pick a suggestion or type your own">
              <Input
                required
                list="compliance-type-suggestions"
                maxLength={64}
                value={form.complianceType}
                onChange={(e) => setForm({ ...form, complianceType: e.target.value })}
              />
              <datalist id="compliance-type-suggestions">
                {COMPLIANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field label="Due date" required>
              <Input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Status" required>
              <Select
                value={form.status}
                options={COMPLIANCE_STATUS_OPTIONS}
                onChange={(e) => setForm({ ...form, status: e.target.value as ComplianceStatus })}
              />
            </Field>
            <Field label="Document link" hint="Full URL starting with https://">
              <Input
                type="url"
                maxLength={2048}
                value={form.documentUrl}
                onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete "${toDelete?.title}"?`}
        message="This compliance record will be removed from the tracker."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default ComplianceTab;
