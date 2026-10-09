"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, todayInput } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { FeeStructure, InvoiceDetail } from "../types";
import { FEE_KEYS, paiseToInput, toPaise } from "../utils";
import StudentPicker, { type PickedStudent } from "./StudentPicker";

interface ItemRow {
  key: number;
  title: string;
  unitAmount: string;
  quantity: string;
  discountAmount: string;
  feeComponentId?: string;
}

let rowKey = 0;
const emptyRow = (patch: Partial<ItemRow> = {}): ItemRow => ({
  key: ++rowKey,
  title: "",
  unitAmount: "",
  quantity: "1",
  discountAmount: "",
  ...patch,
});

const lineTotal = (row: ItemRow) => {
  const gross = toPaise(row.unitAmount) * Math.max(Number.parseInt(row.quantity, 10) || 0, 0);
  return { gross, discount: toPaise(row.discountAmount), net: gross - toPaise(row.discountAmount) };
};

const NewInvoiceModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (invoiceId: string) => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const structures = useApiQuery<FeeStructure[]>(["fees", "structures"], "fee-structures");

  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [dueDate, setDueDate] = useState(todayInput());
  const [rows, setRows] = useState<ItemRow[]>(() => [emptyRow()]);
  const [tax, setTax] = useState("");

  const componentOptions = (structures.data ?? []).flatMap((s) =>
    s.components.map((c) => ({ value: c.id, label: `${s.name} · ${c.name} (${formatCurrency(c.amount, currency)})` })),
  );

  const addComponent = (componentId: string) => {
    for (const s of structures.data ?? []) {
      const c = s.components.find((x) => x.id === componentId);
      if (!c) continue;
      const blank = rows.length === 1 && !rows[0]?.title && !rows[0]?.unitAmount;
      const row = emptyRow({ title: c.name, unitAmount: paiseToInput(toPaise(c.amount)), feeComponentId: c.id });
      setRows(blank ? [row] : [...rows, row]);
      return;
    }
  };

  const update = (key: number, patch: Partial<ItemRow>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const totals = rows.reduce(
    (acc, row) => {
      const line = lineTotal(row);
      return { subtotal: acc.subtotal + line.gross, discount: acc.discount + line.discount };
    },
    { subtotal: 0, discount: 0 },
  );
  const taxPaise = toPaise(tax);
  const totalPaise = totals.subtotal - totals.discount + taxPaise;
  const rowErrors = rows.map((r) => (lineTotal(r).net < 0 ? "Discount is more than the amount" : undefined));
  const valid =
    !!student && !!dueDate && rows.every((r) => r.title.trim() && r.unitAmount !== "") && rowErrors.every((e) => !e) && totalPaise >= 0;

  const create = useApiMutation(
    () =>
      api.post<InvoiceDetail>("invoices", {
        studentId: student!.id,
        dueDate,
        taxTotal: taxPaise > 0 ? Number(paiseToInput(taxPaise)) : undefined,
        items: rows.map((r) => ({
          title: r.title.trim(),
          unitAmount: Number(paiseToInput(toPaise(r.unitAmount))),
          quantity: Number.parseInt(r.quantity, 10) || 1,
          discountAmount: toPaise(r.discountAmount) > 0 ? Number(paiseToInput(toPaise(r.discountAmount))) : undefined,
          feeComponentId: r.feeComponentId,
        })),
      }),
    {
      invalidate: FEE_KEYS,
      success: (inv) => `Invoice ${inv.invoiceNumber} created`,
      onSuccess: (inv) => {
        onClose();
        onCreated(inv.id);
      },
    },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="New Invoice"
      description="Bill one student for any fees. Totals are recalculated by the server."
      size="xl"
      onSubmit={() => valid && create.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={!valid}>
            Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Student" required className="md:col-span-2">
            <StudentPicker value={student} onChange={setStudent} />
          </Field>
          <Field label="Due date" required>
            <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-gray-700">
              Items <span className="text-red-500">*</span>
            </p>
            {componentOptions.length > 0 && (
              <Select
                value=""
                onChange={(e) => e.target.value && addComponent(e.target.value)}
                options={componentOptions}
                placeholder="+ Add from fee structure…"
                className="sm:max-w-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row.key} className="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 p-2">
                <Input
                  aria-label="Item title"
                  className="col-span-12 sm:col-span-4"
                  required
                  maxLength={128}
                  placeholder="e.g. Tuition Fee - Term 1"
                  value={row.title}
                  onChange={(e) => update(row.key, { title: e.target.value })}
                />
                <Input
                  aria-label="Rate"
                  className="col-span-4 sm:col-span-2"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  placeholder="Rate"
                  value={row.unitAmount}
                  onChange={(e) => update(row.key, { unitAmount: e.target.value })}
                />
                <Input
                  aria-label="Quantity"
                  className="col-span-3 sm:col-span-1"
                  type="number"
                  min={1}
                  step={1}
                  value={row.quantity}
                  onChange={(e) => update(row.key, { quantity: e.target.value })}
                />
                <Input
                  aria-label="Discount"
                  className="col-span-5 sm:col-span-2"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Discount"
                  value={row.discountAmount}
                  onChange={(e) => update(row.key, { discountAmount: e.target.value })}
                />
                <div className="col-span-10 flex h-full flex-col justify-center text-right sm:col-span-2">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(lineTotal(row).net / 100, currency)}</span>
                  {rowErrors[i] && <span className="text-[11px] text-red-600">{rowErrors[i]}</span>}
                </div>
                <div className="col-span-2 flex justify-end sm:col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rows.length === 1}
                    onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setRows([...rows, emptyRow()])}>
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Field label={`Tax (${currency})`} className="sm:w-48">
            <Input type="number" min={0} step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" />
          </Field>
          <dl className="w-full max-w-xs space-y-1 text-sm sm:ml-auto">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-semibold">{formatCurrency(totals.subtotal / 100, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Discount</dt>
              <dd className="font-semibold">− {formatCurrency(totals.discount / 100, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tax</dt>
              <dd className="font-semibold">{formatCurrency(taxPaise / 100, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 text-base">
              <dt className="font-bold text-gray-800">Total</dt>
              <dd className="font-bold text-gray-900">{formatCurrency(totalPaise / 100, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  );
};

export default NewInvoiceModal;
