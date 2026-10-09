"use client";

import { useMemo, useState } from "react";
import { Ban, Eye, FilePlus2, Layers, Wallet } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, Checkbox, EmptyState, Field, Modal, Pagination, QueryState, SearchInput, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { INVOICE_STATUSES, type CollectTarget, type InvoiceListItem, type InvoiceStatus } from "../types";
import { FEE_KEYS, statusLabel, statusTone, toPaise } from "../utils";
import InvoiceDetailModal from "./InvoiceDetailModal";
import NewInvoiceModal from "./NewInvoiceModal";
import BulkInvoiceModal from "./BulkInvoiceModal";

const InvoicesTab = ({
  onCollect,
  onViewReceipt,
}: {
  onCollect?: (target?: CollectTarget) => void;
  onViewReceipt: (paymentId: string) => void;
}) => {
  const can = useCan();
  const canCreate = can(PERMISSIONS.INVOICE_CREATE);
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const classes = useClasses();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim());

  const [viewId, setViewId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceListItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const params = {
    page,
    limit: 20,
    status: status || undefined,
    classId: sectionId ? undefined : classId || undefined,
    sectionId: sectionId || undefined,
    overdue: overdue || undefined,
    search: debouncedSearch || undefined,
  };
  const invoices = usePaginatedQuery<InvoiceListItem>(["fees", "invoices"], "invoices", params);

  const sectionOptions = useMemo(
    () =>
      (classes.data?.find((c) => c.id === classId)?.sections ?? []).map((s) => ({ value: s.id, label: `Section ${s.name}` })),
    [classes.data, classId],
  );

  const voidInvoice = useApiMutation(
    (vars: { id: string; reason: string }) => api.post(`invoices/${vars.id}/void`, { reason: vars.reason }),
    {
      invalidate: FEE_KEYS,
      success: "Invoice voided",
      onSuccess: () => {
        setVoidTarget(null);
        setVoidReason("");
      },
    },
  );

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      {
        id: "invoiceNumber",
        header: "Invoice No",
        cell: ({ row }) => <span className="text-xs font-bold uppercase text-gray-500">{row.original.invoiceNumber}</span>,
      },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <p className="text-sm font-bold text-gray-900">{row.original.student.name}</p>
            <p className="text-xs text-gray-500">{row.original.student.admissionNumber}</p>
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-gray-600">{row.original.sectionLabel ?? "—"}</span>,
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(row.original.totalAmount, currency)}</span>
        ),
      },
      {
        id: "paid",
        header: "Paid",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(row.original.paidAmount, currency)}</span>
        ),
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(row.original.balanceAmount, currency)}</span>
        ),
      },
      {
        id: "dueDate",
        header: "Due Date",
        cell: ({ row }) => (
          <span className={`whitespace-nowrap text-sm ${row.original.isOverdue ? "font-semibold text-red-600" : "text-gray-600"}`}>
            {formatDate(row.original.dueDate)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone(row.original.status, row.original.isOverdue)}>
            {statusLabel(row.original.status, row.original.isOverdue)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const inv = row.original;
          const isOpen = (inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID") && toPaise(inv.balanceAmount) > 0;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setViewId(inv.id)} aria-label="View invoice">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {onCollect && isOpen && (
                <Button
                  size="sm"
                  onClick={() =>
                    onCollect({ student: { ...inv.student, sectionLabel: inv.sectionLabel }, invoiceIds: [inv.id] })
                  }
                >
                  <Wallet className="h-3.5 w-3.5" /> Collect
                </Button>
              )}
              {canCreate && inv.status !== "VOID" && toPaise(inv.paidAmount) === 0 && (
                <Button variant="ghost" size="sm" onClick={() => setVoidTarget(inv)} aria-label="Void invoice">
                  <Ban className="h-3.5 w-3.5 text-red-500" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currency, onCollect, canCreate],
  );

  const filtered = !!(status || classId || sectionId || overdue || debouncedSearch);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <SearchInput
            value={search}
            onChange={resetPage(setSearch)}
            placeholder="Student, admission or invoice no."
            className="sm:col-span-2 xl:col-span-2"
          />
          <Select
            value={status}
            onChange={(e) => resetPage(setStatus)(e.target.value as InvoiceStatus | "")}
            options={INVOICE_STATUSES}
            placeholder="All statuses"
          />
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
              setPage(1);
            }}
            options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All classes"
          />
          <Select
            value={sectionId}
            onChange={(e) => resetPage(setSectionId)(e.target.value)}
            options={sectionOptions}
            placeholder={classId ? "All sections" : "Pick a class first"}
            disabled={!classId}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Checkbox label="Overdue only" checked={overdue} onChange={resetPage(setOverdue)} />
          {canCreate && (
            <>
              <Button variant="secondary" onClick={() => setShowBulk(true)}>
                <Layers className="h-4 w-4" /> Generate Invoices
              </Button>
              <Button onClick={() => setShowNew(true)}>
                <FilePlus2 className="h-4 w-4" /> New Invoice
              </Button>
            </>
          )}
        </div>
      </div>

      <QueryState
        isLoading={invoices.isLoading}
        error={invoices.error}
        onRetry={() => invoices.refetch()}
        isEmpty={!invoices.data?.data.length}
        empty={
          <EmptyState
            title={filtered ? "No invoices match these filters" : "No invoices yet"}
            description={
              filtered
                ? "Try clearing the filters or searching for something else."
                : "Generate invoices for a class from a fee structure, or create one for a single student."
            }
            action={
              !filtered &&
              canCreate && (
                <Button onClick={() => setShowBulk(true)}>
                  <Layers className="h-4 w-4" /> Generate Invoices
                </Button>
              )
            }
          />
        }
      >
        <DataTable columns={columns} data={invoices.data?.data ?? []} />
        <Pagination meta={invoices.data?.meta} onPageChange={setPage} />
      </QueryState>

      <InvoiceDetailModal
        invoiceId={viewId}
        onClose={() => setViewId(null)}
        onViewReceipt={(id) => {
          setViewId(null);
          onViewReceipt(id);
        }}
        onCollect={
          onCollect &&
          ((target) => {
            setViewId(null);
            onCollect(target);
          })
        }
      />

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} onCreated={(id) => setViewId(id)} />}
      {showBulk && <BulkInvoiceModal onClose={() => setShowBulk(false)} />}

      <Modal
        open={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title={`Void ${voidTarget?.invoiceNumber ?? "invoice"}?`}
        description="A void invoice no longer counts towards dues. This cannot be undone."
        size="sm"
        onSubmit={() => voidTarget && voidReason.trim() && voidInvoice.mutate({ id: voidTarget.id, reason: voidReason.trim() })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setVoidTarget(null)} disabled={voidInvoice.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={voidInvoice.isPending} disabled={!voidReason.trim()}>
              Void invoice
            </Button>
          </>
        }
      >
        {voidTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {voidTarget.student.name} · {formatCurrency(voidTarget.totalAmount, currency)} due {formatDate(voidTarget.dueDate)}
            </p>
            <Field label="Reason" required>
              <Textarea
                required
                maxLength={500}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Issued twice by mistake"
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesTab;
