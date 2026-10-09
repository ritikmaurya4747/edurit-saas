"use client";

import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { PortalChild, PortalTimetable, TimetableEntry } from "../../types";
import PortalPage from "../../components/PortalPage";
import { DAY_NAMES, DAY_SHORT, formatClock } from "../../components/portal-ui";

// Monday-first school week; Sunday only shows if something is scheduled.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default function MyTimetablePage() {
  return <PortalPage title="Timetable">{(student) => <TimetableBody key={student.id} student={student} />}</PortalPage>;
}

function TimetableBody({ student }: { student: PortalChild }) {
  const query = useApiQuery<PortalTimetable>([PORTAL_KEY, "timetable", student.id], portalPath(student.id, "timetable"));
  const [pickedDay, setPickedDay] = useState<number | null>(null);

  if (query.isLoading) return <LoadingState label="Loading timetable…" />;
  if (query.error || !query.data) {
    return <ErrorState message={query.error?.message ?? "Could not load the timetable."} onRetry={() => query.refetch()} />;
  }

  const { entries, dayOfWeek: today } = query.data;
  if (!entries.length) {
    return (
      <EmptyState
        title="No timetable yet"
        description={
          student.sectionId
            ? "The class timetable for this session has not been published yet."
            : "The timetable appears once the student is enrolled in a class."
        }
      />
    );
  }

  const days = WEEK.filter((d) => d !== 0 || entries.some((e) => e.dayOfWeek === 0) || today === 0);
  const periods = [...new Set(entries.map((e) => e.periodNumber))].sort((a, b) => a - b);
  const cell = new Map(entries.map((e) => [`${e.dayOfWeek}:${e.periodNumber}`, e]));
  const timeOf = (period: number) => entries.find((e) => e.periodNumber === period);
  const mobileDay = pickedDay ?? (days.includes(today) ? today : days[0]!);
  const dayEntries = entries.filter((e) => e.dayOfWeek === mobileDay);

  return (
    <div>
      {query.data.academicYear && <p className="mb-3 text-xs text-gray-500">Session {query.data.academicYear.name}</p>}

      {/* Mobile: one day at a time */}
      <div className="md:hidden">
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPickedDay(d)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold",
                d === mobileDay ? "border-[#1C263A] bg-[#1C263A] text-white" : "border-gray-200 bg-white text-gray-600",
              )}
            >
              {DAY_SHORT[d]}
              {d === today && <span className="ml-1 opacity-70">· Today</span>}
            </button>
          ))}
        </div>
        {dayEntries.length === 0 ? (
          <EmptyState title={`No classes on ${DAY_NAMES[mobileDay]}`} />
        ) : (
          <ul className="space-y-2">
            {dayEntries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                  {e.periodNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{e.subject.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {e.teacherName || "—"}
                    {e.roomNumber ? ` · Room ${e.roomNumber}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-right text-xs font-semibold text-gray-600">
                  {formatClock(e.startTime)}
                  <br />
                  {formatClock(e.endTime)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop: week grid */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 border-b border-gray-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Period
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={cn(
                    "border-b border-gray-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide",
                    d === today ? "bg-[#1C263A] text-white" : "text-gray-500",
                  )}
                >
                  {DAY_SHORT[d]}
                  {d === today && <span className="ml-1 font-semibold normal-case opacity-80">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => {
              const t = timeOf(p);
              return (
                <tr key={p} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 align-top">
                    <p className="font-bold text-gray-900">P{p}</p>
                    {t && (
                      <p className="text-[11px] text-gray-500">
                        {formatClock(t.startTime)} – {formatClock(t.endTime)}
                      </p>
                    )}
                  </td>
                  {days.map((d) => (
                    <td key={d} className={cn("px-2 py-1.5 align-top", d === today && "bg-[#1C263A]/[0.04]")}>
                      <Slot entry={cell.get(`${d}:${p}`)} showTime={!!t && cell.get(`${d}:${p}`)?.startTime !== t.startTime} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Slot = ({ entry, showTime }: { entry?: TimetableEntry; showTime: boolean }) => {
  if (!entry) return <span className="block py-2 text-center text-xs text-gray-300">—</span>;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
      <p className="text-xs font-bold text-gray-900">{entry.subject.name}</p>
      <p className="truncate text-[11px] text-gray-500">{entry.teacherName || "—"}</p>
      {(entry.roomNumber || showTime) && (
        <p className="text-[10px] text-gray-400">
          {showTime ? `${formatClock(entry.startTime)} – ${formatClock(entry.endTime)}` : ""}
          {showTime && entry.roomNumber ? " · " : ""}
          {entry.roomNumber ? `Room ${entry.roomNumber}` : ""}
        </p>
      )}
    </div>
  );
};
