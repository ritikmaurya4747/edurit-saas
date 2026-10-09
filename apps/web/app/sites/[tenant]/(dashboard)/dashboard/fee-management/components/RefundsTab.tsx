"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, EmptyState, Pagination, QueryState, SearchInput } from "@/components/ui";
import { useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDateTime, humanize } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { RefundListItem } from "../types";
import { methodLabel } from "../utils";

const RefundsTab = ({ onViewReceipt }: { onViewReceipt: (paymentId: string) => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim());

  const refunds = usePaginatedQuery<RefundListItem>(["fees", "refunds"], "refunds", {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo<ColumnDef<RefundListItem>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-gray-600">{formatDateTime(row.original.processedAt)}</span>,
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
        id: "receipt",
        header: "Receipt",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onViewReceipt(row.original.paymentId)}
            className="cursor-pointer text-left text-xs font-bold uppercase text-[#1C263A] underline-offset-2 hover:underline"
          >
            {row.original.receiptNumber ?? "View"}
            <span className="block text-[11px] font-normal normal-case text-gray-500">
              {methodLabel(row.original.payment.method)} · {formatCurrency(row.original.payment.amount, currency)}
            </span>
          </button>
        ),
      },
      {
        id: "amount",
        header: "Refunded",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(row.original.amount, currency)}</span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => <span className="block max-w-xs text-sm text-gray-600">{row.original.reason}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "COMPLETED" ? "green" : "yellow"}>{humanize(row.original.status)}</Badge>
        ),
      },
    ],
    [currency, onViewReceipt],
  );

  return (
    <div>
      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Receipt no, student or reason"
        />
      </div>
      <QueryState
        isLoading={refunds.isLoading}
        error={refunds.error}
        onRetry={() => refunds.refetch()}
        isEmpty={!refunds.data?.data.length}
        empty={
          <EmptyState
            title={debouncedSearch ? "No refunds match this search" : "No refunds yet"}
            description="Refunds are issued from the Receipts tab and show up here."
          />
        }
      >
        <DataTable columns={columns} data={refunds.data?.data ?? []} />
        <Pagination meta={refunds.data?.meta} onPageChange={setPage} />
      </QueryState>
    </div>
  );
};

export default RefundsTab;
