import { AppWindow, Avatar, Pill } from "./AppWindow";

const students = [
  { name: "Amara Fernandes", roll: 12, s: "P" },
  { name: "Rohan Bhatt", roll: 13, s: "P" },
  { name: "Sara Iyer", roll: 14, s: "A" },
  { name: "Devansh Rao", roll: 15, s: "P" },
  { name: "Meher Kapoor", roll: 16, s: "L" },
  { name: "Arjun Nair", roll: 17, s: "P" },
];

export function AttendanceMock() {
  return (
    <AppWindow title="Attendance · Class 7-B · Monday">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p className="font-display text-[0.95rem] font-bold">Class 7-B register</p>
          <p className="text-[0.7rem] text-ink-faint">Period 1 · Ms. Anita Desai</p>
        </div>
        <div className="flex gap-1.5">
          <Pill tone="green">28 present</Pill>
          <Pill tone="red">1 absent</Pill>
          <Pill tone="amber">1 late</Pill>
        </div>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {students.map((st, i) => (
          <li key={st.roll} className="flex items-center justify-between px-4 py-2">
            <span className="flex items-center gap-2.5">
              <span className="w-5 text-ink-faint">{st.roll}</span>
              <Avatar name={st.name} tone={i} />
              {st.name}
            </span>
            <span className="flex gap-1">
              {(["P", "A", "L"] as const).map((k) => (
                <span
                  key={k}
                  className={
                    st.s === k
                      ? k === "P"
                        ? "flex h-6 w-6 items-center justify-center rounded-md bg-meadow text-[0.68rem] font-bold text-white"
                        : k === "A"
                        ? "flex h-6 w-6 items-center justify-center rounded-md bg-clay text-[0.68rem] font-bold text-white"
                        : "flex h-6 w-6 items-center justify-center rounded-md bg-sun text-[0.68rem] font-bold text-ink"
                      : "flex h-6 w-6 items-center justify-center rounded-md border border-line text-[0.68rem] text-ink-faint"
                  }
                >
                  {k}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line bg-paper px-4 py-2.5">
        <p className="text-[0.7rem] text-ink-faint">Parents of absent students notified automatically</p>
        <span className="rounded-full bg-brand px-3 py-1 text-[0.7rem] font-semibold text-white">Submit</span>
      </div>
    </AppWindow>
  );
}
