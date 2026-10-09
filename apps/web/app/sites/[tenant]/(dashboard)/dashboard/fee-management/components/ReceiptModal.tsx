"use client";

import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button, Modal, QueryState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import type { Receipt } from "../types";
import { methodLabel, toPaise } from "../utils";

// Only the receipt is printed; everything else on the page is hidden.
const PRINT_CSS = `@media print { body * { visibility:hidden } #receipt-print, #receipt-print * { visibility:visible } #receipt-print { position:absolute; inset:0 } }`;

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between gap-4 py-0.5">
    <span className="text-gray-500">{label}</span>
    <span className="text-right font-semibold text-gray-900">{value}</span>
  </div>
);

const ReceiptModal = ({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) => {
  const receipt = useApiQuery<Receipt>(["fees", "receipt", paymentId], paymentId ? `payments/${paymentId}` : null);
  const r = receipt.data;
  const currency = r?.currency ?? "INR";

  return (
    <Modal
      open={!!paymentId}
      onClose={onClose}
      title="Payment Receipt"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} disabled={!r}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </>
      }
    >
      <style>{PRINT_CSS}</style>
      <QueryState isLoading={receipt.isLoading} error={receipt.error} onRetry={() => receipt.refetch()}>
        {r && (
          <div id="receipt-print" className="bg-white p-1 text-sm text-gray-800 print:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
              <div className="flex items-center gap-3">
                {r.school.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.school.logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
                )}
                <div>
                  <p className="font-serif text-lg font-bold text-gray-900">{r.school.name}</p>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Fee Receipt</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-gray-900">{r.payment.receiptNumber ?? "—"}</p>
                <p className="text-gray-500">{formatDateTime(r.payment.paidAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-1 border-b border-gray-200 py-3 text-xs sm:grid-cols-2">
              <Row label="Student" value={r.student?.name ?? "—"} />
              <Row label="Admission no." value={r.student?.admissionNumber ?? "—"} />
              <Row label="Class" value={r.student?.sectionLabel ?? "—"} />
              <Row label="Payment method" value={methodLabel(r.payment.paymentMethod)} />
              {r.payment.gatewayRef && <Row label="Reference" value={r.payment.gatewayRef} />}
              {r.collectedBy && <Row label="Collected by" value={r.collectedBy} />}
            </div>

            <div className="overflow-x-auto py-3">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400">
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-2">Invoice</th>
                    <th className="py-2 pr-2">Due date</th>
                    <th className="py-2 pr-2 text-right">Invoice total</th>
                    <th className="py-2 pr-2 text-right">Paid now</th>
                    <th className="py-2 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {r.allocations.map((a) => (
                    <tr key={a.invoiceId}>
                      <td className="py-2 pr-2 font-bold">{a.invoiceNumber}</td>
                      <td className="py-2 pr-2">{formatDate(a.dueDate)}</td>
                      <td className="py-2 pr-2 text-right">{formatCurrency(a.invoiceTotal, currency)}</td>
                      <td className="py-2 pr-2 text-right font-semibold">{formatCurrency(a.allocatedAmount, currency)}</td>
                      <td className="py-2 text-right">{formatCurrency(a.balanceAfter, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto max-w-xs space-y-1 border-t border-gray-200 pt-3 text-xs">
              <Row label="Amount received" value={formatCurrency(r.payment.amount, currency)} />
              {toPaise(r.refundedAmount) > 0 && (
                <>
                  <Row label="Refunded" value={<span className="text-red-600">− {formatCurrency(r.refundedAmount, currency)}</span>} />
                  <Row label="Net amount" value={formatCurrency(r.netAmount, currency)} />
                </>
              )}
            </div>

            {r.refunds.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 p-3 text-xs">
                <p className="mb-1 font-bold text-red-700">Refunds</p>
                {r.refunds.map((refund) => (
                  <p key={refund.id} className="text-gray-700">
                    {formatDate(refund.processedAt)} · {formatCurrency(refund.amount, currency)} · {refund.reason}
                  </p>
                ))}
              </div>
            )}

            {r.payment.remarks && <p className="mt-3 text-xs text-gray-500">Remarks: {r.payment.remarks}</p>}
            <p className="mt-6 text-center text-[10px] text-gray-400">This is a computer generated receipt.</p>
          </div>
        )}
      </QueryState>
    </Modal>
  );
};

export default ReceiptModal;
