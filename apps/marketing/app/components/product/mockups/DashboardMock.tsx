import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  Wallet,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import { AppWindow, Avatar, Pill } from "./AppWindow";

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Students" },
  { icon: CalendarCheck, label: "Attendance" },
  { icon: BookOpen, label: "Academics" },
  { icon: Wallet, label: "Fees" },
  { icon: MessageCircle, label: "Messages" },
  { icon: CalendarDays, label: "Timetable" },
];

const week = [92, 94, 91, 95, 96];

export function DashboardMock() {
  return (
    <AppWindow title="EduRit · Principal dashboard">
      <div className="grid sm:grid-cols-[132px_1fr]">
        <aside className="hidden border-r border-line bg-paper/70 p-2.5 sm:block">
          <p className="px-2 pb-2 pt-1 font-display text-sm font-bold">
            EduRit<span className="text-accent">.</span>
          </p>
          <ul className="space-y-0.5">
            {nav.map(({ icon: Icon, label, active }) => (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.72rem] ${
                  active ? "bg-brand font-semibold text-white" : "text-ink-soft"
                }`}
              >
                <Icon size={13} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] text-ink-faint">Monday, 9 February</p>
              <p className="font-display text-[0.95rem] font-bold">Good morning, Mrs. Sharma</p>
            </div>
            <Avatar name="Neha Sharma" tone={1} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Students", "2,847", "bg-teal-soft"],
              ["Teachers", "183", "bg-accent-soft"],
              ["Attendance", "94.2%", "bg-meadow-soft"],
              ["Fees collected", "₹1.24Cr", "bg-sun-soft"],
            ].map(([l, v, bg]) => (
              <div key={l} className={`rounded-xl p-2.5 ${bg}`}>
                <p className="text-[0.62rem] text-ink-soft">{l}</p>
                <p className="font-display text-[0.95rem] font-bold">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl border border-line p-2.5">
              <p className="text-[0.68rem] font-semibold">Attendance this week</p>
              <div className="mt-2 flex h-16 items-end gap-2">
                {week.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md ${i === week.length - 1 ? "bg-accent" : "bg-brand/75"}`}
                      style={{ height: `${(v - 85) * 5}px` }}
                    />
                    <span className="text-[0.55rem] text-ink-faint">{["M", "T", "W", "T", "F"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-line p-2.5">
              <p className="text-[0.68rem] font-semibold">Today</p>
              <ul className="mt-1.5 space-y-1.5 text-[0.66rem]">
                <li className="flex items-center justify-between gap-2">
                  <span>Staff meeting</span>
                  <Pill tone="violet">2:30 pm</Pill>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>Unit test · Gr 8</span>
                  <Pill tone="sky">P3</Pill>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>PTM invites</span>
                  <Pill tone="green">Sent</Pill>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
