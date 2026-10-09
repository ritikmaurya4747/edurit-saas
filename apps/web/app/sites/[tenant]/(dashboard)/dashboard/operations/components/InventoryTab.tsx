"use client";

import { useMemo, useState } from "react";
import { History, Minus, Pencil, Plus, Trash2 } from "lucide-react";
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
  Pagination,
  QueryState,
  SearchInput,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDateTime, formatNumber, humanize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { OPS_KEYS, type InventoryHistoryEntry, type InventoryItem } from "./types";

type ItemForm = { id?: string; sku: string; name: string; quantity: string; reorderLevel: string };

const InventoryTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.OPERATIONS_MANAGE);

  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [form, setForm] = useState<ItemForm | null>(null);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [historyFor, setHistoryFor] = useState<InventoryItem | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);

  const items = usePaginatedQuery<InventoryItem>(["operations", "inventory"], "inventory", {
    search: debouncedSearch.trim() || undefined,
    lowStock: lowStock || undefined,
    page,
    limit: 20,
  });

  const save = useApiMutation(
    ({ id, sku, name, quantity, reorderLevel }: ItemForm) =>
      id
        ? api.patch(`inventory/${id}`, { sku: sku.trim(), name: name.trim(), reorderLevel: Number(reorderLevel) })
        : api.post("inventory", {
            sku: sku.trim(),
            name: name.trim(),
            quantity: Number(quantity || 0),
            reorderLevel: Number(reorderLevel || 0),
          }),
    { invalidate: OPS_KEYS, success: "Item saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`inventory/${id}`), {
    invalidate: OPS_KEYS,
    success: "Item deleted",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs font-bold uppercase text-gray-500">{row.original.sku}</span>,
      },
      { accessorKey: "name", header: "Item", cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.name}</span> },
      {
        accessorKey: "quantity",
        header: "In stock",
        cell: ({ row }) => (
          <span className={cn("font-bold", row.original.lowStock ? "text-red-600" : "text-gray-900")}>
            {formatNumber(row.original.quantity)}
          </span>
        ),
      },
      { accessorKey: "reorderLevel", header: "Reorder level", cell: ({ row }) => formatNumber(row.original.reorderLevel) },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.quantity === 0 ? (
            <Badge tone="red">Out of stock</Badge>
          ) : row.original.lowStock ? (
            <Badge tone="orange">Low stock</Badge>
          ) : (
            <Badge tone="green">In stock</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setAdjusting(row.original)}>
                Adjust stock
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setHistoryFor(row.original)} aria-label="History">
              <History className="h-3.5 w-3.5" />
            </Button>
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Edit"
                  onClick={() =>
                    setForm({
                      id: row.original.id,
                      sku: row.original.sku,
                      name: row.original.name,
                      quantity: String(row.original.quantity),
                      reorderLevel: String(row.original.reorderLevel),
                    })
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => setToDelete(row.original)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canManage],
  );

  const rows = items.data?.data ?? [];
  const hasFilters = !!(debouncedSearch.trim() || lowStock);
  const openCreate = () => setForm({ sku: "", name: "", quantity: "0", reorderLevel: "5" });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-72"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search name or SKU…"
          />
          <Checkbox
            label="Low stock only"
            checked={lowStock}
            onChange={(v) => {
              setLowStock(v);
              setPage(1);
            }}
          />
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        )}
      </div>

      <QueryState
        isLoading={items.isLoading}
        error={items.error}
        onRetry={() => items.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No items match" : "No inventory items yet"}
            description={
              hasFilters
                ? lowStock
                  ? "Nothing is at or below its reorder level."
                  : "Try a different search."
                : "Track stationery, lab supplies, uniforms and more with stock levels and reorder alerts."
            }
            action={
              !hasFilters && canManage ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add item
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
        <Pagination meta={items.data?.meta} onPageChange={setPage} />
      </QueryState>

      {/* Add / edit item */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit item" : "Add inventory item"}
        description={form?.id ? "Use “Adjust stock” to change the quantity." : undefined}
        size="sm"
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Item name" required className="col-span-2">
              <Input
                required
                maxLength={128}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="A4 paper ream"
                autoFocus
              />
            </Field>
            <Field label="SKU" required hint="Unique code, e.g. STN-A4" className="col-span-2">
              <Input
                required
                maxLength={48}
                pattern="[A-Za-z0-9._\/\-]+"
                title="Letters, numbers, ., /, - and _"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="STN-A4"
              />
            </Field>
            {!form.id && (
              <Field label="Opening stock">
                <Input type="number" min={0} step={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </Field>
            )}
            <Field label="Reorder level" required hint="Alert at or below" className={form.id ? "col-span-2" : undefined}>
              <Input
                required
                type="number"
                min={0}
                step={1}
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      {adjusting && <AdjustStockModal item={adjusting} onClose={() => setAdjusting(null)} />}
      {historyFor && <HistoryModal item={historyFor} onClose={() => setHistoryFor(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="The item is removed from the inventory list. Its stock history is kept for audit."
        confirmLabel="Delete"
      />
    </div>
  );
};

const AdjustStockModal = ({ item, onClose }: { item: InventoryItem; onClose: () => void }) => {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const qty = Math.floor(Number(amount) || 0);
  const delta = mode === "add" ? qty : -qty;
  const after = item.quantity + delta;
  const invalid = qty <= 0 || after < 0;

  const adjust = useApiMutation(
    (body: { delta: number; reason: string }) => api.post<InventoryItem>(`inventory/${item.id}/adjust`, body),
    { invalidate: OPS_KEYS, success: (r) => `Stock updated — ${r.quantity} in stock`, onSuccess: onClose },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust stock"
      description={`${item.name} (${item.sku})`}
      size="sm"
      onSubmit={() => !invalid && adjust.mutate({ delta, reason: reason.trim() })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={adjust.isPending} disabled={invalid}>
            Save adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={mode === "add" ? "success" : "secondary"} onClick={() => setMode("add")}>
            <Plus className="h-4 w-4" /> Stock in
          </Button>
          <Button variant={mode === "remove" ? "danger" : "secondary"} onClick={() => setMode("remove")}>
            <Minus className="h-4 w-4" /> Stock out
          </Button>
        </div>
        <Field label="Quantity" required>
          <Input
            required
            type="number"
            min={1}
            step={1}
            max={mode === "remove" ? item.quantity : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </Field>
        <Field label="Reason" required>
          <Input
            required
            maxLength={255}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={mode === "add" ? "e.g. Purchase from vendor" : "e.g. Issued to science lab"}
          />
        </Field>
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
          <span className="text-gray-600">
            Current <span className="font-bold text-gray-900">{item.quantity}</span>
          </span>
          <span className="text-gray-600">
            After{" "}
            <span className={cn("font-bold", after < 0 ? "text-red-600" : after <= item.reorderLevel ? "text-amber-600" : "text-gray-900")}>
              {after}
            </span>
          </span>
        </div>
        {after < 0 && <p className="text-xs text-red-600">You can remove at most {item.quantity} unit(s).</p>}
      </div>
    </Modal>
  );
};

const HistoryModal = ({ item, onClose }: { item: InventoryItem; onClose: () => void }) => {
  const history = useApiQuery<InventoryHistoryEntry[]>(["operations", "inventory", item.id, "history"], `inventory/${item.id}/history`);
  const entries = history.data ?? [];

  return (
    <Modal open onClose={onClose} title="Stock history" description={`${item.name} (${item.sku})`} size="lg">
      <QueryState
        isLoading={history.isLoading}
        error={history.error}
        onRetry={() => history.refetch()}
        isEmpty={entries.length === 0}
        empty={<EmptyState title="No history yet" description="Stock adjustments and edits will be listed here." />}
      >
        <ul className="divide-y divide-gray-100">
          {entries.map((e) => {
            const c = e.changes ?? {};
            const delta = typeof c.delta === "number" ? c.delta : null;
            return (
              <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {e.action === "ADJUST_STOCK" ? (delta !== null && delta > 0 ? "Stock in" : "Stock out") : humanize(e.action)}
                    {typeof c.reason === "string" && c.reason && <span className="font-normal text-gray-600"> — {c.reason}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(e.createdAt)}
                    {e.user && <> · {e.user}</>}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  {delta !== null && (
                    <p className={cn("font-bold", delta > 0 ? "text-green-700" : "text-red-600")}>
                      {delta > 0 ? `+${delta}` : delta}
                    </p>
                  )}
                  {typeof c.before === "number" && typeof c.after === "number" && (
                    <p className="text-xs text-gray-500">
                      {c.before} → {c.after}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </QueryState>
    </Modal>
  );
};

export default InventoryTab;
