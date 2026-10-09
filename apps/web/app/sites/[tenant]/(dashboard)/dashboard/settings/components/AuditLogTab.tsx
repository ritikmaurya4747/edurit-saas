"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, EmptyState, Field, Input, Modal, Pagination, QueryState, SearchInput, Select, type BadgeTone } from "@/components/ui";
import { useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { formatDateTime, humanize } from "@/lib/utils/format";
import type { AuditLogEntry } from "./types";

const actionTone = (action: string): BadgeTone => {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("SUSPEND") || a.includes("VOID") || a.includes("REJECT")) return "red";
  if (a.includes("CREATE") || a.includes("ACTIVATE") || a.includes("APPROVE")) return "green";
  if (a.includes("UPDATE") || a.includes("SET")) return "blue";
  return "gray";
};

const summarize = (changes: unknown) => {
  if (!changes || typeof changes !== "object" || !Object.keys(changes as object).length) return "";
  const text = JSON.stringify(changes);
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
};

const emptyFilters = { entityName: "", action: "", from: "", to: "" };

const AuditLogTab = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);
  const debounced = useDebounce(search);

  const facets = useApiQuery<{ entityNames: string[]; actions: string[] }>(["settings", "audit-facets"], "audit-logs/facets", undefined, {
    staleTime: 5 * 60_000,
  });

  const rangeError = filters.from && filters.to && filters.from > filters.to ? "'From' must be before 'To'" : undefined;

  const logs = usePaginatedQuery<AuditLogEntry>(["settings", "audit-logs"], "audit-logs", {
    page,
    limit: 25,
    search: debounced || undefined,
    entityName: filters.entityName || undefined,
    action: filters.action || undefined,
    from: (!rangeError && filters.from) || undefined,
    to: (!rangeError && filters.to) || undefined,
  });

  const update = (patch: Partial<typeof emptyFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const filtersActive = !!(debounced || filters.entityName || filters.action || filters.from || filters.to);

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        id: "when",
        header: "When",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs font-bold text-gray-700">{formatDateTime(row.original.createdAt)}</span>,
      },
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-36">
            <p className="text-sm font-bold text-gray-900">{row.original.userName}</p>
            {row.original.userEmail && <p className="text-xs text-gray-500">{row.original.userEmail}</p>}
          </div>
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => <Badge tone={actionTone(row.original.action)}>{humanize(row.original.action)}</Badge>,
      },
      {
        id: "entity",
        header: "Record",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-bold text-gray-900">{row.original.entityName}</p>
            {row.original.entityId && (
              <p className="font-mono text-[10px] text-gray-400" title={row.original.entityId}>
                {row.original.entityId.slice(0, 8)}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "changes",
        header: "Details",
        cell: ({ row }) => {
          const text = summarize(row.original.changes);
          return text ? (
            <button
              type="button"
              onClick={() => setDetail(row.original)}
              className="max-w-72 cursor-pointer truncate text-left font-mono text-[11px] text-gray-500 hover:text-[#1C263A] hover:underline"
              title="View details"
            >
              {text}
            </button>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_150px_150px_auto] lg:items-end">
        <Field label="Search">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="User, record or action…"
          />
        </Field>
        <Field label="Record type">
          <Select
            value={filters.entityName}
            onChange={(e) => update({ entityName: e.target.value })}
            placeholder="All records"
            options={(facets.data?.entityNames ?? []).map((n) => ({ value: n, label: n }))}
          />
        </Field>
        <Field label="Action">
          <Select
            value={filters.action}
            onChange={(e) => update({ action: e.target.value })}
            placeholder="All actions"
            options={(facets.data?.actions ?? []).map((a) => ({ value: a, label: humanize(a) }))}
          />
        </Field>
        <Field label="From">
          <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value })} />
        </Field>
        <Field label="To" error={rangeError}>
          <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} />
        </Field>
        {filtersActive && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilters(emptyFilters);
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <QueryState
        isLoading={logs.isLoading}
        error={logs.error}
        onRetry={() => logs.refetch()}
        isEmpty={!logs.data?.data.length}
        empty={
          <EmptyState
            title={filtersActive ? "No activity matches these filters" : "No activity recorded yet"}
            description={
              filtersActive
                ? "Try widening the date range or clearing filters."
                : "Changes made by staff (creating, editing, deleting records) will appear here."
            }
          />
        }
      >
        <DataTable columns={columns} data={logs.data?.data ?? []} />
        <Pagination meta={logs.data?.meta} onPageChange={setPage} />
      </QueryState>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${humanize(detail.action)} · ${detail.entityName}` : "Details"}
        description={detail ? `${detail.userName} · ${formatDateTime(detail.createdAt)}` : undefined}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            Close
          </Button>
        }
      >
        {detail && (
          <div className="space-y-3 text-xs">
            {detail.entityId && (
              <p className="text-gray-500">
                Record ID: <span className="font-mono text-gray-700">{detail.entityId}</span>
              </p>
            )}
            {detail.ipAddress && (
              <p className="text-gray-500">
                IP address: <span className="font-mono text-gray-700">{detail.ipAddress}</span>
              </p>
            )}
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-gray-50 p-3 font-mono text-[11px] text-gray-700">
              {JSON.stringify(detail.changes, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogTab;
