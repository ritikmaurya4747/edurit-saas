"use client";

import { cn } from "@/lib/utils/cn";
import { TYPE_STYLE, WEEKDAYS, coversDay, isHolidayItem, layoutWeek, type CalendarItem } from "./utils";

const MAX_LANES = 3;
const LANE_HEIGHT = 22;
const DAY_HEADER = 30;

interface Props {
  weeks: string[][];
  month: number;
  items: CalendarItem[];
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
}

// Month grid (Mon–Sun). Multi-day items render as one bar per week row; when a
// day has more than MAX_LANES items a "+N more" link opens the day list.
const MonthGrid = ({ weeks, month, items, today, selected, onSelect }: Props) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="grid grid-cols-7 border-b border-gray-200 bg-[#FCFBF8]">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className={cn(
            "px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400",
            d === "Sun" && "text-red-400",
          )}
        >
          {d}
        </div>
      ))}
    </div>

    {weeks.map((week) => {
      const segments = layoutWeek(week, items);
      const hidden = week.map((_, col) => segments.filter((s) => s.lane >= MAX_LANES && s.startCol <= col && s.endCol >= col).length);
      return (
        <div
          key={week[0]}
          className="relative grid grid-cols-7 border-b border-gray-100 last:border-b-0"
          style={{ minHeight: DAY_HEADER + (MAX_LANES + 1) * LANE_HEIGHT + 8 }}
        >
          {week.map((date, col) => {
            const inMonth = Number(date.slice(5, 7)) - 1 === month;
            const holiday = items.some((i) => isHolidayItem(i) && coversDay(i, date));
            const isSunday = col === 6;
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                aria-label={`Show items on ${date}`}
                aria-pressed={selected === date}
                className={cn(
                  "flex h-full flex-col items-start border-r border-gray-100 p-1.5 text-left transition-colors last:border-r-0 cursor-pointer hover:bg-gray-50",
                  !inMonth && "bg-gray-50/70",
                  holiday && inMonth && "bg-red-50/60 hover:bg-red-50",
                  selected === date && "ring-2 ring-inset ring-[#1C263A]/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    !inMonth ? "text-gray-300" : holiday || isSunday ? "text-red-600" : "text-gray-700",
                    date === today && "bg-[#1C263A] text-white",
                  )}
                >
                  {Number(date.slice(8, 10))}
                </span>
              </button>
            );
          })}

          <div
            className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-y-0.5"
            style={{ top: DAY_HEADER, gridAutoRows: `${LANE_HEIGHT - 2}px` }}
          >
            {segments
              .filter((s) => s.lane < MAX_LANES)
              .map((s) => {
                const style = TYPE_STYLE[s.item.type] ?? TYPE_STYLE.OTHER;
                return (
                  <button
                    key={`${s.item.source}-${s.item.id}`}
                    type="button"
                    title={s.item.title}
                    onClick={() => onSelect(week[s.startCol] ?? week[0] ?? "")}
                    style={{ gridColumn: `${s.startCol + 1} / ${s.endCol + 2}`, gridRow: s.lane + 1 }}
                    className={cn(
                      "pointer-events-auto mx-1 truncate border px-1.5 text-left text-[11px] font-semibold leading-[18px] cursor-pointer hover:brightness-95",
                      style.chip,
                      s.continuesBefore ? "ml-0 rounded-l-none border-l-0" : "rounded-l-md",
                      s.continuesAfter ? "mr-0 rounded-r-none border-r-0" : "rounded-r-md",
                    )}
                  >
                    {s.item.title}
                  </button>
                );
              })}
            {hidden.map((count, col) =>
              count > 0 ? (
                <button
                  key={`more-${week[col]}`}
                  type="button"
                  onClick={() => onSelect(week[col] ?? "")}
                  style={{ gridColumn: col + 1, gridRow: MAX_LANES + 1 }}
                  className="pointer-events-auto mx-1 truncate rounded-md px-1.5 text-left text-[11px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  +{count} more
                </button>
              ) : null,
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default MonthGrid;
