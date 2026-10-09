"use client";

import { Printer } from "lucide-react";
import { Button, Modal, QueryState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import type { Payslip } from "../types";

// Only the payslip is printed: everything else on the page is hidden.
const PRINT_CSS = `@media print { body * { visibility:hidden } #payslip-print, #payslip-print * { visibility:visible } #payslip-print { position:absolute; inset:0 } }`;

export default function PayslipModal({ payrollId, onClose }: { payrollId: string; onClose: () => void }) {
  const slip = useApiQuery<Payslip>(["staff", "payslip", payrollId], `payroll/${payrollId}/payslip`);
  const p = slip.data;
  const money = (v: number) => formatCurrency(v, p?.school.currency ?? "INR");

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Payslip"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} disabled={!p}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </>
      }
    >
      <style>{PRINT_CSS}</style>
      <QueryState isLoading={slip.isLoading} error={slip.error} onRetry={() => slip.refetch()}>
        {p && (
          <div id="payslip-print" className="bg-white p-1 text-gray-800 print:p-8">
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#1C263A] pb-4">
              <div className="flex items-center gap-3">
                {p.school.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.school.logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
                )}
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-900">{p.school.name}</h2>
                  {p.school.legalName && p.school.legalName !== p.school.name && <p className="text-xs text-gray-500">{p.school.legalName}</p>}
                  {p.school.branch && <p className="text-xs text-gray-500">{p.school.branch}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Salary slip</p>
                <p className="text-sm font-bold text-gray-900">{p.period.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-4 text-sm sm:grid-cols-3">
              <Detail label="Employee" value={p.staff.name} />
              <Detail label="Employee code" value={p.staff.employeeCode} />
              <Detail label="Designation" value={p.staff.designation} />
              <Detail label="Department" value={p.staff.department} />
              <Detail label="Date of joining" value={formatDate(p.staff.joiningDate)} />
              <Detail label="Days in month" value={String(p.period.daysInMonth)} />
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 sm:grid-cols-2">
              <Ledger title="Earnings" rows={p.earnings} total={p.grossEarnings} totalLabel="Gross earnings" money={money} />
              <Ledger
                title="Deductions"
                rows={p.deductions}
                total={p.totalDeductions}
                totalLabel="Total deductions"
                money={money}
                className="border-t border-gray-200 sm:border-l sm:border-t-0"
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-[#1C263A] px-4 py-3 text-white">
              <span className="text-sm font-semibold">Net salary</span>
              <span className="font-serif text-2xl font-bold">{money(p.netSalary)}</span>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Attendance summary</p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
                {[
                  ["Working days", p.attendance.workingDays],
                  ["Present", p.attendance.present],
                  ["Late", p.attendance.late],
                  ["Absent", p.attendance.absent],
                  ["On leave", p.attendance.onLeaveDays],
                  ["Loss of pay", p.attendance.lossOfPayDays],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-gray-200 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase text-gray-400">{label}</p>
                    <p className="font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between text-xs text-gray-500">
              <p>{p.isDisbursed ? `Disbursed on ${formatDateTime(p.disbursedAt)}` : "Payment pending"}</p>
              <p className="border-t border-gray-300 pt-1">Authorised signatory</p>
            </div>
            <p className="mt-4 text-center text-[10px] text-gray-400">This is a computer-generated payslip.</p>
          </div>
        )}
      </QueryState>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}

function Ledger({
  title,
  rows,
  total,
  totalLabel,
  money,
  className = "",
}: {
  title: string;
  rows: { label: string; amount: number }[];
  total: number;
  totalLabel: string;
  money: (v: number) => string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <p className="bg-[#FCFBF8] px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <div className="flex-1 divide-y divide-gray-100 px-4">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3 py-2 text-sm">
            <span className="text-gray-600">{r.label}</span>
            <span className="font-semibold text-gray-900">{money(r.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-gray-200 px-4 py-2 text-sm font-bold">
        <span>{totalLabel}</span>
        <span>{money(total)}</span>
      </div>
    </div>
  );
}
