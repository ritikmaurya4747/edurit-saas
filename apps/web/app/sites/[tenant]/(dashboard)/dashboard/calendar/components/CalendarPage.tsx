"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, LayoutGrid, List, Plus } from "lucide-react";
import { Button, ConfirmDialog, EmptyState, PageHeader, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils/cn";
import EventFormModal from "./EventFormModal";
import EventItem from "./EventItem";
import MonthGrid from "./MonthGrid";
import {
  CALENDAR_KEYS,
  TYPE_OPTIONS,
  TYPE_STYLE,
  coversDay,
  day,
  formatRange,
  monthLabel,
  monthWeeks,
  parseYmd,
  todayIn,
  type CalendarItem,
  type CalendarType,
  type EventForm,
} from "./utils";

type View = "month" | "list";

const CalendarPage = () => {
  const user = useUser();
  const can = useCan();
  const canManage = can(PERMISSIONS.CALENDAR_MANAGE);
  const today = todayIn(user?.timezone);

  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState<string | null>(today);
  const [type, setType] = useState<CalendarType | "">("");
  const [form, setForm] = useState<EventForm | null>(null);
  const [toDelete, setToDelete] = useState<CalendarItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const grid = useMemo(() => monthWeeks(anchor.year, anchor.month), [anchor]);
  const monthStart = `${anchor.year}-${String(anchor.month + 1).padStart(2, "0")}-01`;
  const monthEnd = grid.weeks.flat().filter((d) => d.startsWith(monthStart.slice(0, 7))).pop() ?? monthStart;

  const events = useApiQuery<CalendarItem[]>(["calendar", "events"], view === "month" ? "calendar/events" : null, {
    from: grid.start,
    to: grid.end,
    type: type || undefined,
  });
  const upcoming = useApiQuery<CalendarItem[]>(["calendar", "upcoming"], view === "list" ? "calendar/upcoming" : null, {
    limit: 50,
  });

  const remove = useApiMutation((id: string) => api.delete(`calendar/events/${id}`), {
    invalidate: CALENDAR_KEYS,
    success: "Event deleted",
    onSuccess: () => setToDelete(null),
  });
  const importHolidays = useApiMutation(
    (year: number) => api.post<{ created: number; skipped: number }>("calendar/events/import-holidays", { year }),
    {
      invalidate: CALENDAR_KEYS,
      success: (r) =>
        r.created
          ? `Added ${r.created} national holiday${r.created === 1 ? "" : "s"}${r.skipped ? ` (${r.skipped} already present)` : ""}`
          : "All national holidays for this year are already on the calendar",
      onSuccess: () => setImportOpen(false),
    },
  );

  const items = useMemo(() => events.data ?? [], [events.data]);
  const monthItems = items.filter((i) => day(i.startDate) <= monthEnd && day(i.endDate) >= monthStart);
  const dayItems = selected ? items.filter((i) => coversDay(i, selected)) : [];
  const upcomingItems = (upcoming.data ?? []).filter((i) => !type || i.type === type);

  const shiftMonth = (delta: number) =>
    setAnchor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  const goToday = () => {
    setAnchor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
    setSelected(today);
  };

  const openCreate = () => {
    const start = selected ?? today;
    setForm({ title: "", description: "", type: "EVENT", startDate: start, endDate: start, isHoliday: false, targetRole: "ALL" });
  };
  const openEdit = (item: CalendarItem) =>
    setForm({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      type: item.type,
      startDate: day(item.startDate),
      endDate: day(item.endDate),
      isHoliday: item.isHoliday,
      targetRole: (["ALL", "STAFF", "STUDENT", "PARENT"].includes(item.targetRole) ? item.targetRole : "ALL") as EventForm["targetRole"],
    });

  const itemProps = { canManage, onEdit: openEdit, onDelete: setToDelete };

  return (
    <div>
      <PageHeader
        title="Academic Calendar"
        description={
          canManage
            ? "Plan holidays, PTMs, exams and school events for the whole year"
            : "Holidays, exams and events at your school"
        }
        actions={
          canManage && (
            <>
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <Flag className="h-4 w-4" /> Import national holidays
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add event
              </Button>
            </>
          )
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {view === "month" ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <h2 className="ml-1 font-serif text-xl font-bold text-gray-900">{monthLabel(anchor.year, anchor.month)}</h2>
          </div>
        ) : (
          <h2 className="font-serif text-xl font-bold text-gray-900">Upcoming</h2>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="w-auto min-w-40 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as CalendarType | "")}
            options={TYPE_OPTIONS}
            placeholder="All types"
            aria-label="Filter by type"
          />
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            {(
              [
                { id: "month", label: "Month", icon: LayoutGrid },
                { id: "list", label: "Upcoming", icon: List },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                  view === id ? "bg-[#1C263A] text-white" : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" ? (
        <QueryState isLoading={events.isLoading} error={events.error} onRetry={() => events.refetch()}>
          {/* Desktop / tablet: grid + day panel */}
          <div className={cn("hidden gap-5 md:grid lg:grid-cols-[1fr_320px]", events.isFetching && "opacity-80")}>
            <div>
              <MonthGrid
                weeks={grid.weeks}
                month={anchor.month}
                items={items}
                today={today}
                selected={selected}
                onSelect={setSelected}
              />
              <Legend />
            </div>
            <aside className="rounded-xl border border-gray-200 bg-[#FCFBF8] p-4">
              {selected ? (
                <>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Selected day</p>
                      <h3 className="font-serif text-lg font-bold text-gray-900">{formatRange(selected, selected)}</h3>
                    </div>
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    )}
                  </div>
                  {dayItems.length ? (
                    <div className="space-y-2">
                      {dayItems.map((item) => (
                        <EventItem key={`${item.source}-${item.id}`} item={item} compact {...itemProps} />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-xs text-gray-500">
                      Nothing scheduled on this day.
                    </p>
                  )}
                </>
              ) : (
                <p className="py-6 text-center text-xs text-gray-500">Click a day to see its events.</p>
              )}
            </aside>
          </div>

          {/* Mobile: month agenda */}
          <div className="md:hidden">
            <Agenda
              items={monthItems}
              rangeStart={monthStart}
              today={today}
              itemProps={itemProps}
              empty={
                <EmptyState
                  title="Nothing scheduled this month"
                  description="Holidays, exams and events for this month will appear here."
                  action={
                    canManage ? (
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Add event
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          </div>
        </QueryState>
      ) : (
        <QueryState
          isLoading={upcoming.isLoading}
          error={upcoming.error}
          onRetry={() => upcoming.refetch()}
          isEmpty={upcomingItems.length === 0}
          empty={
            <EmptyState
              title={type ? "No upcoming items of this type" : "No upcoming events"}
              description={
                canManage
                  ? "Add holidays, PTMs and school events so staff, students and parents can plan ahead."
                  : "Upcoming holidays, exams and events will appear here."
              }
              action={
                type ? (
                  <Button variant="secondary" size="sm" onClick={() => setType("")}>
                    Show all types
                  </Button>
                ) : canManage ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add event
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <Agenda items={upcomingItems} rangeStart={today} today={today} itemProps={itemProps} />
        </QueryState>
      )}

      {form && <EventFormModal key={form.id ?? "new"} initial={form} onClose={() => setForm(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="Delete this event?"
        message={
          <>
            <span className="font-semibold text-gray-900">{toDelete?.title}</span> will be removed from everyone&apos;s
            calendar.
          </>
        }
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={() => importHolidays.mutate(anchor.year)}
        loading={importHolidays.isPending}
        tone="primary"
        title={`Import national holidays for ${anchor.year}?`}
        confirmLabel="Import"
        message={
          <div className="space-y-2">
            <p>The following fixed-date holidays will be added (ones already on the calendar are skipped):</p>
            <ul className="list-disc space-y-0.5 pl-5 font-semibold text-gray-800">
              <li>Republic Day — 26 Jan {anchor.year}</li>
              <li>Independence Day — 15 Aug {anchor.year}</li>
              <li>Gandhi Jayanti — 02 Oct {anchor.year}</li>
            </ul>
            <p className="text-xs text-gray-500">Festivals that follow the lunar calendar change every year — add them manually.</p>
          </div>
        }
      />
    </div>
  );
};

const Legend = () => (
  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
    {(Object.keys(TYPE_STYLE) as CalendarType[]).map((t) => (
      <span key={t} className="inline-flex items-center gap-1.5">
        <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_STYLE[t].dot)} /> {TYPE_STYLE[t].label}
      </span>
    ))}
  </div>
);

interface AgendaProps {
  items: CalendarItem[];
  rangeStart: string;
  today: string;
  itemProps: { canManage: boolean; onEdit: (i: CalendarItem) => void; onDelete: (i: CalendarItem) => void };
  empty?: ReactNode;
}

// Items grouped by the day they start (or the start of the range for ongoing ones).
const Agenda = ({ items, rangeStart, today, itemProps, empty }: AgendaProps) => {
  if (!items.length) return <>{empty ?? null}</>;
  const groups = new Map<string, CalendarItem[]>();
  items.forEach((item) => {
    const key = day(item.startDate) < rangeStart ? rangeStart : day(item.startDate);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return (
    <div className="space-y-5">
      {[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, group]) => {
          const d = parseYmd(date);
          return (
            <section key={date} className="flex gap-3">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border",
                  date === today ? "border-[#1C263A] bg-[#1C263A] text-white" : "border-gray-200 bg-white text-gray-800",
                )}
              >
                <span className="text-[10px] font-bold uppercase">
                  {d.toLocaleDateString("en-IN", { timeZone: "UTC", month: "short" })}
                </span>
                <span className="font-serif text-xl font-bold leading-none">{d.getUTCDate()}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {group.map((item) => (
                  <EventItem key={`${item.source}-${item.id}`} item={item} compact {...itemProps} />
                ))}
              </div>
            </section>
          );
        })}
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <CalendarDays className="h-3.5 w-3.5" /> Exams are shown automatically from the Exams module.
      </p>
    </div>
  );
};

export default CalendarPage;
