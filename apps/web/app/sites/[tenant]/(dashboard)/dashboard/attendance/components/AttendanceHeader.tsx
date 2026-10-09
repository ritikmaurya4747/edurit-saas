"use client";

import { formatDate } from "@/lib/utils/format";
import type { StatusCounts } from "../types";

interface AttendanceHeaderProps {
  sectionLabel: string;
  date: string;
  total: number;
  counts: StatusCounts;
  unmarked: number;
  onMarkAllPresent?: () => void;
}

const Pill = ({ value, label, className }: { value: number; label: string; className: string }) => (
  <div className={`flex min-w-14.5 flex-col items-center rounded-lg px-3 py-1 ${className}`}>
    <span className="text-lg font-bold">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
);

// Live counts for the roster being marked, with the bulk "Mark all present" action.
const AttendanceHeader = ({ sectionLabel, date, total, counts, unmarked, onMarkAllPresent }: AttendanceHeaderProps) => (
  <div className="mb-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="mb-1 font-serif text-xl font-bold text-gray-900 md:text-2xl">Daily Attendance</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-600">
        <span className="rounded bg-gray-100 px-2 py-1">{sectionLabel}</span>
        <span>•</span>
        <span>{formatDate(date, true)}</span>
      </div>
    </div>

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2 text-sm">
        <Pill value={total} label="Total" className="bg-blue-50 text-blue-700" />
        <Pill value={counts.present} label="Present" className="bg-green-50 text-green-700" />
        <Pill value={counts.absent} label="Absent" className="bg-red-50 text-red-700" />
        <Pill value={counts.late} label="Late" className="bg-yellow-50 text-yellow-700" />
        <Pill value={counts.excused} label="Excused" className="bg-purple-50 text-purple-700" />
        {unmarked > 0 && <Pill value={unmarked} label="Unmarked" className="bg-gray-100 text-gray-600" />}
      </div>

      {onMarkAllPresent && (
        <>
          <div className="hidden h-10 w-px bg-gray-200 sm:block" />
          <button
            type="button"
            onClick={onMarkAllPresent}
            className="cursor-pointer rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
          >
            Mark All Present
          </button>
        </>
      )}
    </div>
  </div>
);

export default AttendanceHeader;
