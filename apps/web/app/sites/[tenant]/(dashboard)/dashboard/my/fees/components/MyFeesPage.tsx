"use client";

import { ChevronDown, Info } from "lucide-react";
import { Badge, EmptyState, ErrorState, LoadingState, StatTile, type BadgeTone } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate, formatDateTime, humanize } from "@/lib/utils/format";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { PortalChild, PortalFees, PortalInvoice } from "../../types";
import PortalPage from "../../components/PortalPage";
import { SectionCard } from "../../components/portal-ui";

const STATUS_TONE: Record<PortalInvoice["status"], BadgeTone> = {
  UNPAID: "yellow",
  PARTIALLY_PAID: "orange",
  PAID: "green",
  VOID: "gray",
};

export default function MyFeesPage() {
  return <PortalPage title="Fees">{(student) => <FeesBody key={student.id} student={student} />}</PortalPage>;
}

function FeesBody({ student }: { student: PortalChild }) {
  const query = useApiQuery<PortalFees>([PORTAL_KEY, "fees", student.id], portalPath(student.id, "fees"));

  if (query.isLoading) return <LoadingState label="Loading fees…" />;
  if (query.error || !query.data) {
    return <ErrorState message={query.error?.message ?? "Could not load fees."} onRetry={() => query.refetch()} />;
  }

  const { totals, invoices, payments, currency } = query.data;
  const money = (v: string | number) => formatCurrency(v, currency);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Balance due" value={money(totals.due)} tone={totals.due > 0 ? "default" : "success"} hint={totals.due > 0 ? undefined : "All fees paid"} />
        <StatTile
          label="Overdue"
          value={money(totals.overdue)}
          tone={totals.overdue > 0 ? "danger" : "default"}
          hint={totals.overdueCount ? `${totals.overdueCount} invoice${totals.overdueCount === 1 ? "" : "s"} past due date` : "Nothing overdue"}
        />
        <StatTile label="Next due date" value={totals.nextDueDate ? formatDate(totals.nextDueDate) : "—"} />
        <StatTile label="Paid so far" value={money(totals.paid)} hint={`of ${money(totals.billed)} billed`} />
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-bold">Pay at the school office.</span> Online payment is not available yet. Please carry the invoice number
          when paying — you will get a receipt, and it will show up here under payment history.
        </p>
      </div>

      <SectionCard title="Invoices">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Fee invoices issued by the school will appear here." />
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <details key={inv.id} className="group rounded-lg border border-gray-200 bg-white" open={inv.isOverdue}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{inv.invoiceNumber}</p>
                    <p className={cn("text-xs", inv.isOverdue ? "font-semibold text-red-600" : "text-gray-500")}>
                      Due {formatDate(inv.dueDate)} · {inv.academicYear}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{money(inv.totalAmount)}</p>
                      {Number(inv.balanceAmount) > 0 && (
                        <p className={cn("text-[11px] font-semibold", inv.isOverdue ? "text-red-600" : "text-amber-700")}>
                          {money(inv.balanceAmount)} due
                        </p>
                      )}
                    </div>
                    {inv.isOverdue ? <Badge tone="red">Overdue</Badge> : <Badge tone={STATUS_TONE[inv.status]}>{humanize(inv.status)}</Badge>}
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="border-t border-gray-100 px-3 py-3">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {inv.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 pr-2 text-gray-700">
                            {item.title}
                            {item.quantity > 1 && <span className="text-xs text-gray-400"> × {item.quantity}</span>}
                            {Number(item.discountAmount) > 0 && (
                              <span className="block text-[11px] text-green-700">Discount {money(item.discountAmount)}</span>
                            )}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-gray-900">{money(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <dl className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs">
                    {Number(inv.discountTotal) > 0 && <Row label="Discount" value={`− ${money(inv.discountTotal)}`} />}
                    {Number(inv.taxTotal) > 0 && <Row label="Tax" value={money(inv.taxTotal)} />}
                    <Row label="Total" value={money(inv.totalAmount)} strong />
                    <Row label="Paid" value={money(inv.paidAmount)} />
                    <Row label="Balance" value={money(inv.balanceAmount)} strong />
                  </dl>
                </div>
              </details>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Payment history">
        {payments.length === 0 ? (
          <EmptyState title="No payments yet" description="Receipts for fees paid at the school office will be listed here." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.receiptNumber ?? "Receipt pending"}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(p.paidAt)} · {humanize(p.method)}
                    {p.invoices.length > 0 && ` · for ${p.invoices.map((i) => i.invoiceNumber).join(", ")}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-700">{money(p.amount)}</p>
                  {p.refunded > 0 && <p className="text-[11px] font-semibold text-amber-700">{money(p.refunded)} refunded</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={cn("flex justify-between", strong ? "font-bold text-gray-900" : "text-gray-600")}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);
