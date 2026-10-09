"use client";

import { useMemo, useState } from "react";
import { Printer, Undo2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Button, EmptyState, Field, Input, Modal, Pagination, QueryState, SearchInput, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { PAYMENT_METHODS, type PaymentListItem, type PaymentMethod } from "../types";
import { FEE_KEYS, methodLabel, paiseToInput, toPaise } from "../utils";

const ReceiptsTab = ({ onViewReceipt }: { onViewReceipt: (paymentId: string) => void }) => {
  const can = useCan();
  const canRefund = can(PERMISSIONS.PAYMENT_REFUND);
  const user = useUser();
  const currency = user?.currency ?? "INR";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debouncedSearch = useDebounce(search.trim());

  const [refundFor, setRefundFor] = useState<PaymentListItem | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const payments = usePaginatedQuery<PaymentListItem>(["fees", "payments"], "payments", {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    method: method || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const refundable = (p: PaymentListItem) => toPaise(p.amount) - toPaise(p.refundedAmount);
  const refundMax = refundFor ? refundable(refundFor) : 0;
  const refundPaise = toPaise(refundAmount);
  const refundError = refundAmount && (refundPaise <= 0 || refundPaise > refundMax)
    ? `Enter an amount between ${formatCurrency(0.01, currency)} and ${formatCurrency(refundMax / 100, currency)}`
    : undefined;

  const refund = useApiMutation(
    () =>
      api.post(`payments/${refundFor!.id}/refunds`, { amount: Number(paiseToInput(refundPaise)), reason: refundReason.trim() }),
    {
      invalidate: FEE_KEYS,
      success: "Refund recorded",
      onSuccess: () => setRefundFor(null),
    },
  );

  const openRefund = (p: PaymentListItem) => {
    setRefundFor(p);
    setRefundAmount(paiseToInput(refundable(p)));
    setRefundReason("");
  };

  const columns = useMemo<ColumnDef<PaymentListItem>[]>(
    () => [
      {
        id: "receipt",
        header: "Receipt No",
        cell: ({ row }) => <span className="text-xs font-bold uppercase text-gray-500">{row.original.receiptNumber ?? "—"}</span>,
      },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) =>
          row.original.student ? (
            <div className="min-w-[140px]">
              <p className="text-sm font-bold text-gray-900">{row.original.student.name}</p>
              <p className="text-xs text-gray-500">{row.original.student.admissionNumber}</p>
            </div>
          ) : (
            "—"
          ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(row.original.amount, currency)}</span>
        ),
      },
      {
        id: "method",
        header: "Method",
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">
            {methodLabel(row.original.paymentMethod)}
            {row.original.gatewayRef && <p className="text-[11px] text-gray-400">{row.original.gatewayRef}</p>}
          </div>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-gray-600">{formatDateTime(row.original.paidAt)}</span>,
      },
      {
        id: "refunded",
        header: "Refunded",
        cell: ({ row }) =>
          toPaise(row.original.refundedAmount) > 0 ? (
            <span className="whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(row.original.refundedAmount, currency)}</span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => onViewReceipt(row.original.id)}>
              <Printer className="h-3.5 w-3.5" /> Receipt
            </Button>
            {canRefund && refundable(row.original) > 0 && (
              <Button variant="ghost" size="sm" onClick={() => openRefund(row.original)}>
                <Undo2 className="h-3.5 w-3.5 text-red-500" /> Refund
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, canRefund, onViewReceipt],
  );

  const filtered = !!(debouncedSearch || method || from || to);

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Receipt no, student or admission no."
          className="sm:col-span-2"
        />
        <Select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value as PaymentMethod | "");
            setPage(1);
          }}
          options={PAYMENT_METHODS}
          placeholder="All methods"
        />
        <Input type="date" aria-label="From date" value={from} onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }} />
        <Input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }} />
      </div>

      <QueryState
        isLoading={payments.isLoading}
        error={payments.error}
        onRetry={() => payments.refetch()}
        isEmpty={!payments.data?.data.length}
        empty={
          <EmptyState
            title={filtered ? "No receipts match these filters" : "No payments collected yet"}
            description={
              filtered ? "Try a different search or date range." : "Use “Collect Payment” to record a fee payment and print its receipt."
            }
          />
        }
      >
        <DataTable columns={columns} data={payments.data?.data ?? []} />
        <Pagination meta={payments.data?.meta} onPageChange={setPage} />
      </QueryState>

      <Modal
        open={!!refundFor}
        onClose={() => setRefundFor(null)}
        title={`Refund ${refundFor?.receiptNumber ?? "payment"}`}
        description="The refunded amount is added back to the invoices this payment settled (latest first)."
        size="sm"
        onSubmit={() => !refundError && refundPaise > 0 && refundReason.trim() && refund.mutate()}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundFor(null)} disabled={refund.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={refund.isPending}
              disabled={!!refundError || refundPaise <= 0 || !refundReason.trim()}
            >
              Refund {refundPaise > 0 ? formatCurrency(refundPaise / 100, currency) : ""}
            </Button>
          </>
        }
      >
        {refundFor && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {refundFor.student?.name ?? "Student"} paid {formatCurrency(refundFor.amount, currency)}
              {toPaise(refundFor.refundedAmount) > 0 && <> · already refunded {formatCurrency(refundFor.refundedAmount, currency)}</>}
            </p>
            <Field label={`Amount (${currency})`} required error={refundError} hint={`Up to ${formatCurrency(refundMax / 100, currency)}`}>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                max={refundMax / 100}
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </Field>
            <Field label="Reason" required>
              <Textarea required maxLength={1000} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptsTab;
