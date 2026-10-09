"use client";

import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, EmptyState, ErrorState, Input, LoadingState, StatTile } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { formatDate, humanize } from "@/lib/utils/format";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { AttendanceDay, PortalAttendance, PortalChild } from "../../types";
import PortalPage from "../../components/PortalPage";
import { ATTENDANCE_LABEL, DAY_SHORT, LEAVE_TONE, SectionCard, plural } from "../../components/portal-ui";
import LeaveModal from "./LeaveModal";

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthTitle = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" });

const CELL_STYLE: Record<string, string> = {
  PRESENT: "bg-green-50 border-green-200 text-green-800",
  ABSENT: "bg-red-50 border-red-200 text-red-700",
  LATE: "bg-amber-50 border-amber-200 text-amber-800",
  EXCUSED: "bg-blue-50 border-blue-200 text-blue-700",
  LEAVE: "bg-sky-50 border-sky-200 text-sky-700",
  HOLIDAY: "bg-purple-50 border-purple-200 text-purple-700",
  NONE: "bg-white border-gray-100 text-gray-500",
  FUTURE: "bg-gray-50/50 border-gray-100 text-gray-300",
};

const LEGEND = [
  { key: "PRESENT", label: "Present" },
  { key: "ABSENT", label: "Absent" },
  { key: "LATE", label: "Late" },
  { key: "EXCUSED", label: "Excused" },
  { key: "LEAVE", label: "On leave" },
  { key: "HOLIDAY", label: "Holiday" },
];

const dayKind = (day: AttendanceDay) => {
  if (day.status) return day.status;
  if (day.holiday) return "HOLIDAY";
  if (day.leaveStatus === "APPROVED") return "LEAVE";
  if (day.isFuture) return "FUTURE";
  return "NONE";
};

const dayShortLabel = (day: AttendanceDay) => {
  if (day.status) return day.status === "PRESENT" ? "P" : day.status === "ABSENT" ? "A" : day.status === "LATE" ? "L" : "E";
  if (day.holiday) return "H";
  if (day.leaveStatus === "APPROVED") return "LV";
  return "";
};

const dayTitle = (day: AttendanceDay) =>
  [
    formatDate(day.date, true),
    day.status ? ATTENDANCE_LABEL[day.status] : null,
    day.holiday ? `Holiday: ${day.holiday}` : null,
    day.leaveStatus ? `Leave ${day.leaveStatus.toLowerCase()}` : null,
    day.remarks,
  ]
    .filter(Boolean)
    .join(" · ");

export default function MyAttendancePage() {
  return (
    <PortalPage title="Attendance">
      {(student) => <AttendanceBody key={student.id} student={student} />}
    </PortalPage>
  );
}

function AttendanceBody({ student }: { student: PortalChild }) {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const query = useApiQuery<PortalAttendance>(
    [PORTAL_KEY, "attendance", student.id],
    portalPath(student.id, "attendance"),
    { month },
    { placeholderData: (prev) => prev },
  );

  if (query.isLoading) return <LoadingState label="Loading attendance…" />;
  if (query.error || !query.data) {
    return <ErrorState message={query.error?.message ?? "Could not load attendance."} onRetry={() => query.refetch()} />;
  }

  const data = query.data;
  const current = data.today.slice(0, 7);
  const leading = data.days[0]?.dayOfWeek ?? 0;
  const s = data.summary;

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => setMonth(shiftMonth(data.month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-36 text-center font-serif text-lg font-bold text-gray-900">{monthTitle(data.month)}</h2>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next month"
            disabled={data.month >= current}
            onClick={() => setMonth(shiftMonth(data.month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Input
            type="month"
            aria-label="Choose month"
            value={data.month}
            max={current}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="hidden w-40 py-1.5 sm:block"
          />
          {query.isFetching && <span className="text-xs text-gray-400">Updating…</span>}
        </div>
        {student.canApplyLeave && (
          <Button onClick={() => setLeaveOpen(true)}>
            <CalendarPlus className="h-4 w-4" /> Apply for leave
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Attendance this month"
          value={s.percent != null ? `${s.percent}%` : "—"}
          hint={s.total ? `${s.present + s.late} of ${plural(s.total, "day")}` : "Not marked yet"}
          tone={s.percent == null ? "default" : s.percent < 75 ? "danger" : s.percent < 85 ? "warning" : "success"}
        />
        <StatTile label="Present" value={s.present} hint={s.late ? `+ ${s.late} late` : undefined} />
        <StatTile label="Absent" value={s.absent} tone={s.absent > 0 ? "danger" : "default"} />
        <StatTile label="Excused" value={s.excused} />
      </div>

      {/* Calendar */}
      <SectionCard title="Daily attendance">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {DAY_SHORT.map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {d}
            </div>
          ))}
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {data.days.map((day) => {
            const kind = dayKind(day);
            const isToday = day.date === data.today;
            return (
              <div
                key={day.date}
                title={dayTitle(day)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border text-center sm:aspect-auto sm:h-16",
                  CELL_STYLE[kind],
                  isToday && "ring-2 ring-[#1C263A] ring-offset-1",
                )}
              >
                <span className="text-xs font-bold sm:text-sm">{Number(day.date.slice(8))}</span>
                <span className="text-[9px] font-bold sm:text-[10px]">
                  <span className="sm:hidden">{dayShortLabel(day)}</span>
                  <span className="hidden sm:inline">
                    {day.status ? ATTENDANCE_LABEL[day.status] : day.holiday ? "Holiday" : day.leaveStatus === "APPROVED" ? "Leave" : ""}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className={cn("h-3 w-3 rounded border", CELL_STYLE[l.key])} />
              {l.label}
            </span>
          ))}
        </div>
        {data.days.some((d) => d.holiday) && (
          <ul className="mt-3 space-y-0.5 text-xs text-gray-500">
            {[...new Map(data.days.filter((d) => d.holiday).map((d) => [d.holiday, d.date])).entries()].map(([title, date]) => (
              <li key={title}>
                <span className="font-semibold text-purple-700">{title}</span> · {formatDate(date)}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Leaves */}
      <SectionCard title="Leave requests">
        {!student.canApplyLeave && (
          <p className="mb-3 text-xs text-gray-500">Leave can be requested by a parent or guardian from their own login.</p>
        )}
        {data.leaves.length === 0 ? (
          <EmptyState
            title="No leave requests yet"
            description={student.canApplyLeave ? "Planning a day off? Send a leave request to the class teacher." : undefined}
            action={
              student.canApplyLeave ? (
                <Button size="sm" onClick={() => setLeaveOpen(true)}>
                  Apply for leave
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.leaves.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {l.startDate === l.endDate ? formatDate(l.startDate) : `${formatDate(l.startDate)} – ${formatDate(l.endDate)}`}
                    <span className="ml-2 text-xs font-normal text-gray-500">{plural(l.days, "day")}</span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-xs text-gray-600">{l.reason}</p>
                  {l.actionReason && <p className="mt-1 text-xs italic text-gray-500">School: {l.actionReason}</p>}
                </div>
                <Badge tone={LEAVE_TONE[l.status]} className="self-start">
                  {humanize(l.status)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {student.canApplyLeave && leaveOpen && (
        <LeaveModal open onClose={() => setLeaveOpen(false)} student={student} today={data.today} />
      )}
    </div>
  );
}
