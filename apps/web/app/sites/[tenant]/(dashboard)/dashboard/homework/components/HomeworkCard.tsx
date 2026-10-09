"use client";

import { formatDateTime } from "@/lib/utils/format";
import { isOverdue, type HomeworkItem } from "../types";

const HomeworkCard = ({ homework, onOpen }: { homework: HomeworkItem; onOpen: (id: string) => void }) => {
  const overdue = isOverdue(homework.dueDate);
  const { totalStudents, submitted, graded } = homework.counts;
  const progress = totalStudents ? Math.min(100, Math.round((submitted / totalStudents) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(homework.id)}
      className="flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="mb-3 flex w-full items-start justify-between gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
          {homework.subject.name}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${
            overdue ? "border-gray-200 bg-gray-50 text-gray-600" : "border-yellow-200 bg-yellow-50 text-yellow-700"
          }`}
        >
          {homework.section.label}
        </span>
      </div>

      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">{homework.title}</h3>
      <p className="mb-4 line-clamp-3 grow text-sm text-gray-500">{homework.description}</p>

      <div className="mb-4 w-full">
        <div className="mb-1 flex justify-between text-xs font-semibold text-gray-500">
          <span>
            {submitted}/{totalStudents} submitted
          </span>
          {graded > 0 && <span>{graded} graded</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#1C263A]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-auto flex w-full items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-400 sm:text-xs">ASSIGNED BY</span>
          <span className="text-xs font-semibold text-gray-700 sm:text-sm">{homework.staff.name || "—"}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-medium text-gray-400 sm:text-xs">{overdue ? "WAS DUE" : "DUE"}</span>
          <span className={`text-xs font-semibold sm:text-sm ${overdue ? "text-red-600" : "text-gray-700"}`}>
            {formatDateTime(homework.dueDate)}
          </span>
        </div>
      </div>
    </button>
  );
};

export default HomeworkCard;
