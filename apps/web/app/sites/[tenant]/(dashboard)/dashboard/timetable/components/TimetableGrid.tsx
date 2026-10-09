"use client";

import { Fragment, useMemo } from "react";
import { buildSchedule, DAYS, SCHOOL_DAY, type TimetableEntry } from "../types";
import TimetableCell from "./TimetableCell";

interface TimetableGridProps {
  entries: TimetableEntry[];
  mode: "section" | "teacher";
  // When provided, cells are clickable (edit / add).
  onCellClick?: (slot: { dayOfWeek: number; periodNumber: number; start: string; end: string }, entry?: TimetableEntry) => void;
}

const gridCols = "grid-cols-[88px_repeat(6,minmax(140px,1fr))]";

const TimetableGrid = ({ entries, mode, onCellClick }: TimetableGridProps) => {
  const bySlot = useMemo(() => new Map(entries.map((e) => [`${e.dayOfWeek}:${e.periodNumber}`, e])), [entries]);
  const rows = useMemo(() => {
    const maxPeriod = entries.reduce((max, e) => Math.max(max, e.periodNumber), SCHOOL_DAY.periodCount);
    return buildSchedule(maxPeriod);
  }, [entries]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <div className={`grid w-full min-w-232 ${gridCols}`}>
          <div className="border-b border-gray-200 bg-[#FCFBF8] px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Period
          </div>
          {DAYS.map((day) => (
            <div
              key={day.value}
              className="border-b border-gray-200 bg-[#FCFBF8] px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-400"
            >
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </div>
          ))}

          {rows.map((row) =>
            row.kind === "break" ? (
              <div
                key={`break-${row.start}`}
                className="col-span-7 flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400"
              >
                {row.label}
                <span className="font-medium normal-case tracking-normal">
                  {row.start} – {row.end}
                </span>
              </div>
            ) : (
              <Fragment key={`p-${row.period}`}>
                <div className="flex flex-col justify-center border-b border-gray-100 px-4 py-2">
                  <span className="text-sm font-bold text-gray-700">P{row.period}</span>
                  <span className="text-[10px] text-gray-400">
                    {row.start}–{row.end}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const entry = bySlot.get(`${day.value}:${row.period}`);
                  return (
                    <div key={day.value} className="border-b border-gray-100 p-1.5">
                      <TimetableCell
                        entry={entry}
                        mode={mode}
                        onClick={
                          onCellClick
                            ? () =>
                                onCellClick(
                                  { dayOfWeek: day.value, periodNumber: row.period, start: row.start, end: row.end },
                                  entry,
                                )
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </Fragment>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
