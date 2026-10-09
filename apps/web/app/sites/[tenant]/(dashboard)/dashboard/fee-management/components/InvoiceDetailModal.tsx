"use client";

import { Wallet } from "lucide-react";
import { Badge, Button, Modal, QueryState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import type { CollectTarget, InvoiceDetail } from "../types";
import { methodLabel, statusLabel, statusTone, toPaise } from "../utils";

const InvoiceDetailModal = ({
  invoiceId,
  onClose,
  onViewReceipt,
  onCollect,
}: {
  invoiceId: string | null;
  onClose: () => void;
  onViewReceipt: (paymentId: string) => void;
  onCollect?: (target: CollectTarget) => void;
}) => {
  const invoice = useApiQuery<InvoiceDetail>(["fees", "invoice", invoiceId], invoiceId ? `invoices/${invoiceId}` : null);
  const inv = invoice.data;
  const currency = inv?.currency ?? "INR";
  const isOpen = !!inv && (inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID") && toPaise(inv.balanceAmount) > 0;

  return (
    <Modal
      open={!!invoiceId}
      onClose={onClose}
      title={inv ? `Invoice ${inv.invoiceNumber}` : "Invoice"}
      description={inv ? `${inv.student.name} · ${inv.student.admissionNumber}${inv.student.sectionLabel ? ` · ${inv.student.sectionLabel}` : ""}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {inv && isOpen && onCollect && (
            <Button
              onClick={() =>
                onCollect({
                  student: { id: inv.student.id, name: inv.student.name, admissionNumber: inv.student.admissionNumber, sectionLabel: inv.student.sectionLabel },
                  invoiceIds: [inv.id],
                })
              }
            >
              <Wallet className="h-4 w-4" /> Collect {formatCurrency(inv.balanceAmount, currency)}
            </Button>
          )}
        </>
      }
    >
      <QueryState isLoading={invoice.isLoading} error={invoice.error} onRetry={() => invoice.refetch()}>
        {inv && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
              <Badge tone={statusTone(inv.status, inv.isOverdue)}>{statusLabel(inv.status, inv.isOverdue)}</Badge>
              <span>
                Due <b className="text-gray-900">{formatDate(inv.dueDate)}</b>
              </span>
              <span>
                Issued <b className="text-gray-900">{formatDate(inv.createdAt)}</b>
              </span>
              <span>
                Session <b className="text-gray-900">{inv.academicYear.name}</b>
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="bg-[#FCFBF8] text-[10px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inv.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-semibold text-gray-800">{item.title}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.unitAmount, currency)}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {toPaise(item.discountAmount) > 0 ? `− ${formatCurrency(item.discountAmount, currency)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCurrency(item.totalAmount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto max-w-xs space-y-1 text-xs">
              {[
                ["Subtotal", formatCurrency(inv.subtotal, currency)],
                ...(toPaise(inv.discountTotal) > 0 ? [["Discount", `− ${formatCurrency(inv.discountTotal, currency)}`]] : []),
                ...(toPaise(inv.taxTotal) > 0 ? [["Tax", formatCurrency(inv.taxTotal, currency)]] : []),
                ["Total", formatCurrency(inv.totalAmount, currency)],
                ["Paid", formatCurrency(inv.paidAmount, currency)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-1">
                <dt className="font-bold text-gray-700">Balance</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(inv.balanceAmount, currency)}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Payments</h4>
              {inv.allocations.length === 0 ? (
                <p className="text-xs text-gray-500">No payments recorded against this invoice yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {inv.allocations.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                      <div>
                        <button
                          type="button"
                          onClick={() => onViewReceipt(a.payment.id)}
                          className="cursor-pointer font-bold text-[#1C263A] underline-offset-2 hover:underline"
                        >
                          {a.payment.receiptNumber ?? "Receipt"}
                        </button>
                        <span className="ml-2 text-gray-500">
                          {methodLabel(a.payment.method)} · {formatDateTime(a.payment.paidAt)}
                          {a.payment.gatewayRef ? ` · ${a.payment.gatewayRef}` : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-green-700">{formatCurrency(a.allocatedAmount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {inv.refunds.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Refunds</h4>
                <ul className="divide-y divide-gray-100 rounded-lg border border-red-100">
                  {inv.refunds.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="text-gray-600">
                        {formatDate(r.processedAt)} · {r.receiptNumber} · {r.reason}
                      </span>
                      <span className="font-semibold text-red-600">− {formatCurrency(r.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </QueryState>
    </Modal>
  );
};

export default InvoiceDetailModal;
