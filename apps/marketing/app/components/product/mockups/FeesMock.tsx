import { AppWindow, Avatar, Pill } from "./AppWindow";

const invoices = [
  { name: "Devansh Rao", cls: "7-B", amt: "₹8,400", status: "Paid", mode: "UPI" },
  { name: "Sara Iyer", cls: "7-B", amt: "₹8,400", status: "Due", mode: "—" },
  { name: "Kabir Mehta", cls: "9-A", amt: "₹9,200", status: "Paid", mode: "Cash" },
  { name: "Ananya Das", cls: "5-C", amt: "₹6,800", status: "Overdue", mode: "—" },
  { name: "Ishaan Gupta", cls: "9-A", amt: "₹9,200", status: "Paid", mode: "Card" },
];

export function FeesMock() {
  return (
    <AppWindow title="Fees · Term 3 collection">
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <div className="rounded-xl bg-meadow-soft p-3">
          <p className="text-[0.65rem] text-meadow">Collected</p>
          <p className="font-display text-base font-bold">₹12.4L</p>
        </div>
        <div className="rounded-xl bg-sun-soft p-3">
          <p className="text-[0.65rem] text-[#B45309]">Pending</p>
          <p className="font-display text-base font-bold">₹3.1L</p>
        </div>
        <div className="rounded-xl bg-clay-soft p-3">
          <p className="text-[0.65rem] text-clay">Overdue</p>
          <p className="font-display text-base font-bold">₹0.6L</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="flex justify-between text-[0.65rem] text-ink-faint">
          <span>Term target</span>
          <span>77%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-sunk">
          <div className="h-full w-[77%] rounded-full bg-brand" />
        </div>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {invoices.map((inv, i) => (
          <li key={inv.name} className="flex items-center justify-between gap-2 px-4 py-2">
            <span className="flex items-center gap-2.5">
              <Avatar name={inv.name} tone={i + 1} />
              <span>
                <span className="block">{inv.name}</span>
                <span className="block text-[0.65rem] text-ink-faint">Class {inv.cls} · {inv.mode}</span>
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="tabular-nums font-semibold">{inv.amt}</span>
              <Pill tone={inv.status === "Paid" ? "green" : inv.status === "Due" ? "amber" : "red"}>{inv.status}</Pill>
            </span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}
