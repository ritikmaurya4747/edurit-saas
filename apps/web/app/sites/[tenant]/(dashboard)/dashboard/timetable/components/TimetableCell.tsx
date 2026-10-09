"use client";

import { Plus } from "lucide-react";
import { subjectColor, type TimetableEntry } from "../types";

interface TimetableCellProps {
  entry?: TimetableEntry;
  // Teacher view shows the section instead of the teacher.
  mode: "section" | "teacher";
  onClick?: () => void;
}

const TimetableCell = ({ entry, mode, onClick }: TimetableCellProps) => {
  if (!entry) {
    return onClick ? (
      <button
        type="button"
        onClick={onClick}
        aria-label="Add period"
        className="flex h-full min-h-16 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-300 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-500"
      >
        <Plus className="h-4 w-4" />
      </button>
    ) : (
      <div className="flex h-full min-h-16 items-center justify-center text-xs text-gray-300">—</div>
    );
  }

  const color = subjectColor(entry.subject.id);
  const content = (
    <>
      <div className="mb-0.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
        <span className={`truncate text-sm font-bold ${color.text}`}>{entry.subject.name}</span>
      </div>
      <span className="block truncate pl-3.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {mode === "teacher" ? entry.section.label : entry.staff.name}
      </span>
      {entry.roomNumber && <span className="block pl-3.5 text-[10px] text-gray-400">Room {entry.roomNumber}</span>}
    </>
  );

  const base = `flex h-full min-h-16 w-full flex-col justify-center rounded-lg border px-2.5 py-2 text-left ${color.cell}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} cursor-pointer transition-shadow hover:shadow-md`}>
      {content}
    </button>
  ) : (
    <div className={base}>{content}</div>
  );
};

export default TimetableCell;
