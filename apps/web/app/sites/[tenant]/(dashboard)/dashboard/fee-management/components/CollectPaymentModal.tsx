"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Field, Input, LoadingState, ErrorState, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, usePaginatedQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate, todayInput } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { PAYMENT_METHODS, type CollectTarget, type InvoiceListItem, type PaymentMethod, type Receipt } from "../types";
import { FEE_KEYS, newIdempotencyKey, paiseToInput, statusLabel, statusTone, toPaise } from "../utils";
import StudentPicker, { type PickedStudent } from "./StudentPicker";

const CollectPaymentModal = ({
  target,
  onClose,
  onPaid,
}: {
  target: CollectTarget;
  onClose: () => void;
  onPaid: (paymentId: string) => void;
}) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  // One key per opened modal: a retried / double-clicked submit can never charge twice.
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [student, setStudent] = useState<PickedStudent | null>(target.student ?? null);
  const [selected, setSelected] = useState<Set<string> | null>(null); // null = default selection
  const [amount, setAmount] = useState<string | null>(null); // null = total due
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [paidOn, setPaidOn] = useState(todayInput());

  const invoices = usePaginatedQuery<InvoiceListItem>(["fees", "invoices", "open"], student ? "invoices" : null, {
    studentId: student?.id,
    limit: 100,
  });

  const open = useMemo(
    () =>
      (invoices.data?.data ?? [])
        .filter((i) => (i.status === "UNPAID" || i.status === "PARTIALLY_PAID") && toPaise(i.balanceAmount) > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.invoiceNumber.localeCompare(b.invoiceNumber)),
    [invoices.data],
  );

  const selection = useMemo(() => {
    if (selected) return selected;
    const preset = target.invoiceIds?.filter((id) => open.some((i) => i.id === id));
    return new Set(preset?.length ? preset : open.map((i) => i.id));
  }, [selected, target.invoiceIds, open]);

  const chosen = open.filter((i) => selection.has(i.id));
  const duePaise = chosen.reduce((sum, i) => sum + toPaise(i.balanceAmount), 0);
  const amountValue = amount ?? (duePaise > 0 ? paiseToInput(duePaise) : "");
  const amountPaise = toPaise(amountValue);

  // Preview of how the amount will be applied (oldest due first) — mirrors the API.
  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    let left = amountPaise;
    for (const inv of chosen) {
      const take = Math.min(left, toPaise(inv.balanceAmount));
      if (take <= 0) break;
      map.set(inv.id, take);
      left -= take;
    }
    return map;
  }, [chosen, amountPaise]);

  const amountError =
    amountValue && amountPaise <= 0
      ? "Enter an amount greater than zero"
      : amountPaise > duePaise
        ? `Cannot exceed the total due of ${formatCurrency(duePaise / 100, currency)}`
        : undefined;

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selection);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
    setAmount(null);
  };

  const pay = useApiMutation(
    () =>
      api.post<Receipt>("payments", {
        studentId: student!.id,
        amount: Number(paiseToInput(amountPaise)),
        paymentMethod: method,
        idempotencyKey,
        gatewayRef: reference.trim() || undefined,
        remarks: remarks.trim() || undefined,
        paidAt: paidOn || undefined,
        invoiceIds: chosen.map((i) => i.id),
      }),
    {
      invalidate: FEE_KEYS,
      success: (r) => `Payment recorded · ${r.payment.receiptNumber ?? "receipt ready"}`,
      onSuccess: (r) => onPaid(r.payment.id),
    },
  );

  const canSubmit = !!student && chosen.length > 0 && amountPaise > 0 && !amountError;

  return (
    <Modal
      open
      onClose={onClose}
      title="Collect Payment"
      description="Record a fee payment against a student's outstanding invoices"
      size="lg"
      onSubmit={() => canSubmit && !pay.isPending && pay.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={pay.isPending} disabled={!canSubmit}>
            Collect {amountPaise > 0 ? formatCurrency(amountPaise / 100, currency) : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Student" required>
          <StudentPicker
            value={student}
            onChange={(s) => {
              setStudent(s);
              setSelected(null);
              setAmount(null);
            }}
          />
        </Field>

        {student && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-700">Outstanding invoices</p>
            {invoices.isLoading ? (
              <LoadingState label="Loading invoices…" className="py-6" />
            ) : invoices.error ? (
              <ErrorState message={invoices.error.message} onRetry={() => invoices.refetch()} />
            ) : open.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
                This student has no outstanding invoices.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-[#FCFBF8] text-[10px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Due</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                      <th className="px-3 py-2 text-right">Applying</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {open.map((inv) => (
                      <tr key={inv.id} className={selection.has(inv.id) ? "" : "opacity-60"}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Include ${inv.invoiceNumber}`}
                            checked={selection.has(inv.id)}
                            onChange={(e) => toggle(inv.id, e.target.checked)}
                            className="h-4 w-4 cursor-pointer accent-[#1C263A]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-gray-800">{inv.invoiceNumber}</span>
                          {inv.isOverdue && (
                            <Badge tone={statusTone(inv.status, true)} className="ml-2 px-1.5 py-0 text-[10px]">
                              {statusLabel(inv.status, true)}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{formatDate(inv.dueDate)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(inv.balanceAmount, currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-green-700">
                          {allocation.has(inv.id) ? formatCurrency(allocation.get(inv.id)! / 100, currency) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td />
                      <td colSpan={2} className="px-3 py-2 font-bold text-gray-700">
                        Total due ({chosen.length} selected)
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(duePaise / 100, currency)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {student && open.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={`Amount (${currency})`} required error={amountError} hint="Defaults to the total due; edit for part payment">
              <Input
                type="number"
                inputMode="decimal"
                min={0.01}
                step="0.01"
                required
                value={amountValue}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Payment method" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHODS} />
            </Field>
            <Field label="Reference" hint="UPI / transaction id, cheque no.">
              <Input value={reference} maxLength={128} onChange={(e) => setReference(e.target.value)} />
            </Field>
            <Field label="Payment date" required>
              <Input type="date" required max={todayInput()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <Textarea rows={2} maxLength={1000} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CollectPaymentModal;
