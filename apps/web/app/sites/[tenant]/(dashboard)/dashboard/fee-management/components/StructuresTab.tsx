"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useAcademicYears } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatCurrency } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { FeeStructure } from "../types";
import { FEE_KEYS, paiseToInput, toPaise } from "../utils";

interface ComponentRow {
  key: number;
  id?: string;
  name: string;
  amount: string;
}

interface StructureForm {
  id?: string;
  name: string;
  components: ComponentRow[];
}

let rowKey = 0;
const row = (patch: Partial<ComponentRow> = {}): ComponentRow => ({ key: ++rowKey, name: "", amount: "", ...patch });

const StructuresTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.FEE_STRUCTURE_MANAGE);
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const years = useAcademicYears();
  const [yearId, setYearId] = useState("");
  const structures = useApiQuery<FeeStructure[]>(["fees", "structures"], "fee-structures", {
    academicYearId: yearId || undefined,
  });

  const [form, setForm] = useState<StructureForm | null>(null);
  const [toDelete, setToDelete] = useState<FeeStructure | null>(null);

  const formTotal = form?.components.reduce((sum, c) => sum + toPaise(c.amount), 0) ?? 0;
  const formValid =
    !!form && !!form.name.trim() && form.components.length > 0 && form.components.every((c) => c.name.trim() && toPaise(c.amount) > 0);

  const save = useApiMutation(
    (f: StructureForm) => {
      const body = {
        name: f.name.trim(),
        components: f.components.map((c) => ({
          ...(c.id && { id: c.id }),
          name: c.name.trim(),
          amount: Number(paiseToInput(toPaise(c.amount))),
        })),
      };
      return f.id
        ? api.patch(`fee-structures/${f.id}`, body)
        : api.post("fee-structures", { ...body, academicYearId: yearId || undefined });
    },
    { invalidate: FEE_KEYS, success: form?.id ? "Fee structure updated" : "Fee structure created", onSuccess: () => setForm(null) },
  );

  const remove = useApiMutation((id: string) => api.delete(`fee-structures/${id}`), {
    invalidate: FEE_KEYS,
    success: "Fee structure deleted",
    onSuccess: () => setToDelete(null),
  });

  const openCreate = () => setForm({ name: "", components: [row({ name: "Tuition Fee" })] });
  const openEdit = (s: FeeStructure) =>
    setForm({
      id: s.id,
      name: s.name,
      components: s.components.map((c) => row({ id: c.id, name: c.name, amount: paiseToInput(toPaise(c.amount)) })),
    });
  const updateRow = (key: number, patch: Partial<ComponentRow>) =>
    form && setForm({ ...form, components: form.components.map((c) => (c.key === key ? { ...c, ...patch } : c)) });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Select
          className="sm:max-w-xs"
          aria-label="Academic year"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          options={(years.data ?? []).filter((y) => !y.isCurrent).map((y) => ({ value: y.id, label: y.name }))}
          placeholder={`Current year${years.data?.find((y) => y.isCurrent) ? ` (${years.data.find((y) => y.isCurrent)!.name})` : ""}`}
        />
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Fee Structure
          </Button>
        )}
      </div>

      <QueryState
        isLoading={structures.isLoading}
        error={structures.error}
        onRetry={() => structures.refetch()}
        isEmpty={!structures.data?.length}
        empty={
          <EmptyState
            title="No fee structures yet"
            description="A fee structure lists the annual fee components (tuition, transport, lab…) used to generate invoices."
            action={canManage && <Button onClick={openCreate}>Create fee structure</Button>}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {structures.data?.map((s) => (
            <Card key={s.id} className="flex flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-500">
                    {s.academicYear.name} · {s.components.length} component{s.components.length === 1 ? "" : "s"}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label="Edit fee structure">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(s)} aria-label="Delete fee structure">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
              <ul className="mb-3 space-y-1.5 text-sm">
                {s.components.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span className="text-gray-600">{c.name}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(c.amount, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                <Badge tone="blue">Annual total</Badge>
                <span className="font-serif text-xl text-gray-900">{formatCurrency(s.totalAmount, currency)}</span>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Fee Structure" : "New Fee Structure"}
        description="Annual amounts per student. Invoices can be split into installments when generating."
        size="lg"
        onSubmit={() => form && formValid && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!formValid}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <Field label="Name" required>
              <Input
                required
                maxLength={128}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Class 8 Fees 2026-27"
              />
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-700">
                Components <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {form.components.map((c) => (
                  <div key={c.key} className="flex items-center gap-2">
                    <Input
                      aria-label="Component name"
                      required
                      maxLength={128}
                      value={c.name}
                      onChange={(e) => updateRow(c.key, { name: e.target.value })}
                      placeholder="Component (e.g. Transport)"
                    />
                    <Input
                      aria-label="Amount"
                      className="w-36 shrink-0"
                      type="number"
                      min={0.01}
                      step="0.01"
                      required
                      value={c.amount}
                      onChange={(e) => updateRow(c.key, { amount: e.target.value })}
                      placeholder="Amount"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={form.components.length === 1}
                      onClick={() => setForm({ ...form, components: form.components.filter((x) => x.key !== c.key) })}
                      aria-label="Remove component"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, components: [...form.components, row()] })}>
                  <Plus className="h-3.5 w-3.5" /> Add component
                </Button>
                <p className="text-sm">
                  <span className="text-gray-500">Annual total </span>
                  <span className="font-bold text-gray-900">{formatCurrency(formTotal / 100, currency)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="Invoices already generated from this structure are kept. You will not be able to generate new invoices from it."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default StructuresTab;
