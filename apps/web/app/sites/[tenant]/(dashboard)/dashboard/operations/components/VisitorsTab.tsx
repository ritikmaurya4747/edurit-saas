"use client";

import { useMemo, useState, type FormEvent } from "react";
import { LogIn, LogOut, Phone } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Pagination,
  QueryState,
  SearchInput,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, formatTime, todayInput } from "@/lib/utils/format";
import { OPS_KEYS, type Visitor } from "./types";

const EMPTY = { name: "", phone: "", purpose: "" };

// "1h 25m" between two instants (or until now).
const duration = (from: string, to?: string | null) => {
  const mins = Math.max(0, Math.round(((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const VisitorsTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.OPERATIONS_MANAGE);

  const [form, setForm] = useState(EMPTY);
  const [date, setDate] = useState(todayInput());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const inside = usePaginatedQuery<Visitor>(["operations", "visitors", "inside"], "visitors", { active: true, limit: 100 });
  const history = usePaginatedQuery<Visitor>(["operations", "visitors", "history"], "visitors", {
    date: date || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 20,
  });

  const checkIn = useApiMutation((body: typeof EMPTY) => api.post<Visitor>("visitors", body), {
    invalidate: OPS_KEYS,
    success: (v) => `${v.name} checked in`,
    onSuccess: () => setForm(EMPTY),
  });
  const checkOut = useApiMutation((id: string) => api.post<Visitor>(`visitors/${id}/check-out`), {
    invalidate: OPS_KEYS,
    success: (v) => `${v.name} checked out`,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    checkIn.mutate({ name: form.name.trim(), phone: form.phone.trim(), purpose: form.purpose.trim() });
  };

  const columns = useMemo<ColumnDef<Visitor>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Visitor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{row.original.name}</span>
            <span className="text-xs text-gray-500">{row.original.phone}</span>
          </div>
        ),
      },
      {
        accessorKey: "purpose",
        header: "Purpose",
        cell: ({ row }) => <span className="block max-w-xs truncate text-gray-700">{row.original.purpose}</span>,
      },
      {
        accessorKey: "checkIn",
        header: "Check-in",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold text-gray-800">{formatTime(row.original.checkIn)}</span>
            <span className="text-xs text-gray-500">{formatDate(row.original.checkIn)}</span>
          </div>
        ),
      },
      {
        accessorKey: "checkOut",
        header: "Check-out",
        cell: ({ row }) =>
          row.original.checkOut ? (
            <span className="whitespace-nowrap font-semibold text-gray-800">{formatTime(row.original.checkOut)}</span>
          ) : (
            <Badge tone="green">Inside</Badge>
          ),
      },
      {
        id: "duration",
        header: "Duration",
        cell: ({ row }) => <span className="whitespace-nowrap text-gray-600">{duration(row.original.checkIn, row.original.checkOut)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage && !row.original.checkOut ? (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                loading={checkOut.isPending && checkOut.variables === row.original.id}
                onClick={() => checkOut.mutate(row.original.id)}
              >
                <LogOut className="h-3.5 w-3.5" /> Check out
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManage, checkOut],
  );

  const insideRows = inside.data?.data ?? [];
  const historyRows = history.data?.data ?? [];

  return (
    <div className="space-y-6">
      {canManage && (
        <Card className="p-4 md:p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Quick check-in</h2>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_1.4fr_auto] md:items-end">
            <Field label="Visitor name" required>
              <Input required maxLength={128} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </Field>
            <Field label="Phone" required>
              <Input
                required
                type="tel"
                maxLength={32}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98765 43210"
              />
            </Field>
            <Field label="Purpose of visit" required>
              <Input
                required
                maxLength={255}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g. Meeting class teacher of 8-B"
              />
            </Field>
            <Button type="submit" loading={checkIn.isPending}>
              <LogIn className="h-4 w-4" /> Check in
            </Button>
          </form>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">Currently inside</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{insideRows.length}</span>
        </div>
        <QueryState
          isLoading={inside.isLoading}
          error={inside.error}
          onRetry={() => inside.refetch()}
          isEmpty={insideRows.length === 0}
          empty={<EmptyState title="No visitors inside" description="Visitors you check in appear here until they check out." />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insideRows.map((v) => (
              <div key={v.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">{v.name}</p>
                  <p className="truncate text-xs text-gray-600">{v.purpose}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {v.phone}
                    </span>
                    <span>
                      In at <span className="font-semibold text-gray-700">{formatTime(v.checkIn)}</span> · {duration(v.checkIn)}
                    </span>
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={checkOut.isPending && checkOut.variables === v.id}
                    onClick={() => checkOut.mutate(v.id)}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Check out
                  </Button>
                )}
              </div>
            ))}
          </div>
        </QueryState>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-bold text-gray-900">Visitor register</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[170px_260px]">
            <Input
              type="date"
              value={date}
              max={todayInput()}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              aria-label="Visit date"
            />
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Name, phone or purpose…"
            />
          </div>
        </div>
        <QueryState
          isLoading={history.isLoading}
          error={history.error}
          onRetry={() => history.refetch()}
          isEmpty={historyRows.length === 0}
          empty={
            <EmptyState
              title="No visitors found"
              description={date ? `Nobody matching was checked in on ${formatDate(date)}.` : "No visitors match your search."}
              action={
                date ? (
                  <Button variant="secondary" size="sm" onClick={() => setDate("")}>
                    Show all dates
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <DataTable columns={columns} data={historyRows} />
          <Pagination meta={history.data?.meta} onPageChange={setPage} />
        </QueryState>
      </section>
    </div>
  );
};

export default VisitorsTab;
