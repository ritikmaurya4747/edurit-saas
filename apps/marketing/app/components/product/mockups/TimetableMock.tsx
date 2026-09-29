import { AppWindow } from "./AppWindow";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const periods = ["8:00", "8:45", "9:30", "10:30", "11:15"];
const subj: Record<string, string> = {
  M: "bg-brand-soft text-brand-deep",
  S: "bg-teal-soft text-[#0F766E]",
  E: "bg-accent-soft text-accent-deep",
  H: "bg-sun-soft text-[#B45309]",
  P: "bg-meadow-soft text-meadow",
};
const names: Record<string, string> = { M: "Maths", S: "Science", E: "English", H: "Hindi", P: "Sports" };
const grid = ["MSEHM", "ESMPS", "HMSEE", "SEMHP", "MHESM"];

export function TimetableMock() {
  return (
    <AppWindow title="Timetable · Class 7-B · Week 6">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display text-[0.95rem] font-bold">Weekly timetable</p>
        <span className="rounded-full bg-meadow-soft px-2.5 py-1 text-[0.65rem] font-semibold text-meadow">0 conflicts</span>
      </div>
      <div className="overflow-x-auto border-t border-line p-3">
        <div className="grid min-w-[400px] grid-cols-[44px_repeat(5,1fr)] gap-1.5">
          <span />
          {days.map((d) => (
            <span key={d} className="text-center text-[0.65rem] font-semibold text-ink-faint">{d}</span>
          ))}
          {periods.map((p, r) => (
            <div key={p} className="contents">
              <span className="self-center text-[0.62rem] text-ink-faint">{p}</span>
              {days.map((_, c) => {
                const k = grid[r][c];
                return (
                  <span key={c} className={`rounded-lg px-1.5 py-2 text-center text-[0.65rem] font-semibold ${subj[k]}`}>
                    {names[k]}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line bg-paper px-4 py-2.5 text-[0.7rem] text-ink-soft">
        Ms. Desai is free in period 4 on Tuesday · substitute suggested for Mr. Khan
      </div>
    </AppWindow>
  );
}
