"use client";

import type { ReactNode } from "react";
import { Card, StatTile } from "@/components/ui";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate, humanize } from "@/lib/utils/format";
import { ageFrom, type StudentProfile } from "../../types";

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
    <dd className="mt-0.5 text-sm font-semibold text-gray-800 break-words">{children || "—"}</dd>
  </div>
);

const OverviewTab = ({ student: s }: { student: StudentProfile }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const age = ageFrom(s.dob);
  const a = s.attendanceSummary;
  const f = s.feeSummary;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="p-5 xl:col-span-2">
        <h3 className="mb-4 text-sm font-bold text-gray-900">Personal details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Full name">{s.name}</Detail>
          <Detail label="Admission number">{s.admissionNumber}</Detail>
          <Detail label="Admission date">{formatDate(s.admissionDate)}</Detail>
          <Detail label="Date of birth">
            {formatDate(s.dob)}
            {age !== null && <span className="ml-1 text-xs font-normal text-gray-500">({age} yrs)</span>}
          </Detail>
          <Detail label="Gender">{humanize(s.gender)}</Detail>
          <Detail label="Blood group">{s.bloodGroup}</Detail>
          <Detail label="Phone">
            {s.phone && (
              <a href={`tel:${s.phone}`} className="text-blue-700 hover:underline">
                {s.phone}
              </a>
            )}
          </Detail>
          <Detail label="Email">{s.email}</Detail>
          <Detail label="Branch">{s.branch?.name}</Detail>
          <Detail label="Class">{s.currentEnrollment?.sectionLabel}</Detail>
          <Detail label="Roll number">{s.currentEnrollment?.rollNumber}</Detail>
          <div className="sm:col-span-2 lg:col-span-3">
            <Detail label="Address">{s.address}</Detail>
          </div>
        </dl>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Attendance (this year)</h3>
          {a.total === 0 ? (
            <p className="text-xs text-gray-500">No attendance has been recorded yet.</p>
          ) : (
            <>
              <div className="mb-3 flex items-end justify-between">
                <span
                  className={`font-serif text-3xl ${a.percent >= 75 ? "text-green-700" : a.percent >= 60 ? "text-amber-600" : "text-red-600"}`}
                >
                  {a.percent}%
                </span>
                <span className="text-xs text-gray-500">{a.total} sessions</span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#1C263A]" style={{ width: `${Math.min(100, a.percent)}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  ["Present", a.present, "text-green-700"],
                  ["Absent", a.absent, "text-red-600"],
                  ["Late", a.late, "text-amber-600"],
                  ["Excused", a.excused, "text-blue-700"],
                ].map(([label, value, color]) => (
                  <div key={label as string} className="rounded-lg bg-gray-50 py-2">
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <div>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Fees</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Invoiced" value={formatCurrency(f.totalInvoiced, currency)} />
            <StatTile label="Paid" value={formatCurrency(f.totalPaid, currency)} tone="success" />
            <StatTile
              label="Balance"
              value={formatCurrency(f.balance, currency)}
              tone={f.balance > 0 ? "warning" : "default"}
            />
            <StatTile
              label="Overdue invoices"
              value={f.overdueCount}
              tone={f.overdueCount > 0 ? "danger" : "default"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
