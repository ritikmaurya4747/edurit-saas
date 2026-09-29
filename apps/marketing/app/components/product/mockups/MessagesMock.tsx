import { AppWindow, Avatar } from "./AppWindow";

export function MessagesMock() {
  return (
    <AppWindow title="Messages · Parents of Class 7-B">
      <div className="grid sm:grid-cols-[150px_1fr]">
        <ul className="hidden border-r border-line sm:block">
          {[
            ["Class 7-B parents", "Circular sent", true],
            ["Mrs. Iyer", "Thank you, noted", false],
            ["Mr. Rao", "Fee receipt?", false],
            ["Sports committee", "Sports day list", false],
          ].map(([n, p, active], i) => (
            <li key={n as string} className={`flex gap-2 px-3 py-2.5 ${active ? "bg-brand-soft" : ""}`}>
              <Avatar name={n as string} tone={i} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{n}</span>
                <span className="block truncate text-[0.65rem] text-ink-faint">{p}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 bg-paper/60 p-4">
          <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-brand p-3 text-white">
            <p className="text-[0.65rem] font-semibold opacity-80">Circular · Annual Sports Day</p>
            <p className="mt-1 leading-relaxed">
              Sports Day is on Saturday, 14 Feb. Students should report by 7:30 am in house T-shirts.
            </p>
            <p className="mt-1.5 text-right text-[0.6rem] opacity-80">Read by 31 of 34 parents ✓✓</p>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-line bg-white p-3">
            <p className="text-[0.65rem] font-semibold text-accent-deep">Mrs. Iyer</p>
            <p className="mt-1 leading-relaxed">Thank you! Is there a list of events Sara is taking part in?</p>
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-brand-soft p-3">
            <p className="leading-relaxed">Yes — she&apos;s in the 100m relay and long jump. Sharing the schedule now.</p>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-ink-faint">
            <span className="flex-1">Write a message…</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">↑</span>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
