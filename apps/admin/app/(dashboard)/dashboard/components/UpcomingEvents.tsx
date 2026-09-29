import { CalendarDays, ChevronRight } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Parent-Teacher Meeting",
    date: "12 Aug 2026 · 10:00 AM",
  },
  {
    id: 2,
    title: "Independence Day Celebration",
    date: "15 Aug 2026 · 9:00 AM",
  },
];

const UpcomingEvents = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Upcoming Events
        </h2>

        <button className="text-xs font-medium text-blue-600">
          View All →
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {events.map((event) => (
          <button
            key={event.id}
            className="flex w-full items-center gap-3 py-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200">
              <CalendarDays size={18} className="text-slate-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {event.title}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">{event.date}</p>
            </div>

            <ChevronRight size={17} className="text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
