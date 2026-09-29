import { AppWindow, Avatar } from "./AppWindow";

const rows = [
  { name: "Amara Fernandes", m: [92, 88, 95, 90], g: "A+" },
  { name: "Rohan Bhatt", m: [78, 84, 72, 80], g: "A" },
  { name: "Sara Iyer", m: [65, 70, 58, 74], g: "B" },
  { name: "Devansh Rao", m: [88, 91, 86, 94], g: "A+" },
  { name: "Meher Kapoor", m: [81, 76, 90, 85], g: "A" },
];
const subjects = ["Maths", "Science", "English", "Social"];

export function GradebookMock() {
  return (
    <AppWindow title="Gradebook · Class 7-B · Term 2">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-display text-[0.95rem] font-bold">Term 2 results</p>
          <p className="text-[0.7rem] text-ink-faint">Unit test + half-yearly, weighted</p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-[0.7rem] font-medium">Generate report cards</span>
      </div>
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[420px] text-left">
          <thead className="bg-paper text-[0.68rem] text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              {subjects.map((s) => (
                <th key={s} className="px-2 py-2 text-center font-medium">{s}</th>
              ))}
              <th className="px-4 py-2 text-center font-medium">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name} tone={i} />
                    <span className="whitespace-nowrap">{r.name}</span>
                  </span>
                </td>
                {r.m.map((v, j) => (
                  <td key={j} className={`px-2 py-2 text-center tabular-nums ${v < 60 ? "text-clay font-semibold" : ""}`}>{v}</td>
                ))}
                <td className="px-4 py-2 text-center">
                  <span className={`rounded-md px-2 py-0.5 text-[0.7rem] font-bold ${r.g === "A+" ? "bg-meadow-soft text-meadow" : r.g === "A" ? "bg-brand-soft text-brand-deep" : "bg-sun-soft text-[#B45309]"}`}>
                    {r.g}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 border-t border-line bg-paper px-4 py-2.5 text-[0.7rem] text-ink-soft">
        <span className="h-2 w-2 rounded-full bg-clay" />
        1 student flagged below their usual average in English
      </div>
    </AppWindow>
  );
}
