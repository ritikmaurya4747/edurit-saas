import { AppWindow } from "./AppWindow";

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const attendance = [91, 93, 90, 94, 95, 96];
const fees = [40, 58, 66, 72, 81, 88];

function toPoints(values: number[], min: number, max: number) {
  return values
    .map((v, i) => `${(i / (values.length - 1)) * 300},${90 - ((v - min) / (max - min)) * 80}`)
    .join(" ");
}

export function AnalyticsMock() {
  return (
    <AppWindow title="Insights · School overview · 2025–26">
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          ["Attendance", "95.2%", "+1.4%", "text-meadow"],
          ["Fee collection", "88%", "+7%", "text-meadow"],
          ["Avg. score", "76.4", "+2.1", "text-meadow"],
          ["At-risk students", "12", "−4", "text-meadow"],
        ].map(([l, v, d, c]) => (
          <div key={l} className="rounded-xl border border-line p-3">
            <p className="text-[0.65rem] text-ink-faint">{l}</p>
            <p className="mt-0.5 font-display text-lg font-bold">{v}</p>
            <p className={`text-[0.65rem] font-semibold ${c}`}>{d} vs last term</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[0.7rem] font-semibold">Attendance trend</p>
          <svg viewBox="0 0 300 100" className="mt-2 w-full" aria-hidden>
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#E2E8F0" />
            ))}
            <polyline points={toPoints(attendance, 86, 98)} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-1 flex justify-between text-[0.6rem] text-ink-faint">
            {months.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[0.7rem] font-semibold">Fees collected, cumulative</p>
          <div className="mt-2 flex h-[78px] items-end gap-2">
            {fees.map((f, i) => (
              <div key={i} className={`flex-1 rounded-t-md ${i === fees.length - 1 ? "bg-accent" : "bg-brand/70"}`} style={{ height: `${f}%` }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[0.6rem] text-ink-faint">
            {months.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
