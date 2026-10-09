import { Cake, CalendarDays, Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, humanize } from "@/lib/utils/format";
import type { DashboardExam, DashboardOverview, DashboardPayment } from "../data/dashboard.types";
import DashboardCard, { CardEmpty } from "./DashboardCard";

const examRange = (exam: DashboardExam) =>
  exam.startDate.slice(0, 10) === exam.endDate.slice(0, 10)
    ? formatDate(exam.startDate)
    : `${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`;

export const UpcomingExams = ({ exams, today }: { exams: DashboardExam[]; today: string }) => (
  <DashboardCard title="Upcoming exams" href="/dashboard/exams" hrefLabel="View exams">
    {exams.length === 0 ? (
      <CardEmpty>No upcoming exams scheduled.</CardEmpty>
    ) : (
      <ul className="mt-3 space-y-3">
        {exams.map((exam) => {
          const ongoing = exam.startDate.slice(0, 10) <= today;
          return (
            <li key={exam.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 rounded-md bg-[#f5f4f0] p-1.5 text-[#52637a]">
                <CalendarDays className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] font-semibold text-[#111827]">{exam.name}</p>
                <p className="mt-0.5 text-[10px] text-[#718096]">{examRange(exam)}</p>
              </div>
              {ongoing && (
                <span className="shrink-0 rounded bg-amber-50 px-1.5 py-px text-[9px] font-semibold text-amber-700">
                  Ongoing
                </span>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </DashboardCard>
);

export const RecentPayments = ({ payments, currency }: { payments: DashboardPayment[]; currency: string }) => (
  <DashboardCard title="Recent fee payments" href="/dashboard/fee-management" hrefLabel="Open fee management">
    {payments.length === 0 ? (
      <CardEmpty>No fee payments recorded yet.</CardEmpty>
    ) : (
      <ul className="mt-3 space-y-3">
        {payments.map((p) => (
          <li key={p.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 rounded-md bg-emerald-50 p-1.5 text-emerald-700">
              <Receipt className="h-3 w-3" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10.5px] font-semibold text-[#111827]">{p.studentName ?? "Unallocated payment"}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#718096]">
                {p.receiptNumber ? `#${p.receiptNumber} · ` : ""}
                {humanize(p.paymentMethod)} · {formatDateTime(p.paidAt)}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-[#0d1626]">{formatCurrency(p.amount, currency)}</span>
          </li>
        ))}
      </ul>
    )}
  </DashboardCard>
);

export const BirthdaysToday = ({ students }: { students: DashboardOverview["birthdaysToday"] }) => (
  <DashboardCard title="Birthdays today">
    {students.length === 0 ? (
      <CardEmpty>No student birthdays today.</CardEmpty>
    ) : (
      <ul className="mt-3 space-y-2.5">
        {students.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5">
            <span className="rounded-md bg-pink-50 p-1.5 text-pink-600">
              <Cake className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10.5px] font-semibold text-[#111827]">{s.name}</p>
              {s.sectionLabel && <p className="text-[10px] text-[#718096]">{s.sectionLabel}</p>}
            </div>
          </li>
        ))}
      </ul>
    )}
  </DashboardCard>
);
