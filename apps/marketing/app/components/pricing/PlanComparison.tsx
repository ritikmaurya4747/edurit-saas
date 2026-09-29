import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";

type Cell = boolean | string;
const plans = ["Starter", "Standard", "Enterprise"];

// Derived from src/data/pricing.ts — keep both in sync.
const groups: { title: string; rows: [string, Cell, Cell, Cell][] }[] = [
  {
    title: "Scale",
    rows: [
      ["Students", "Up to 100", "Up to 1,000", "Unlimited"],
      ["Teacher accounts", "5", "Unlimited", "Unlimited"],
      ["Schools per account", "1", "1", "Multiple"],
    ],
  },
  {
    title: "Modules",
    rows: [
      ["Attendance", "Basic", true, true],
      ["Grade entry", true, true, true],
      ["Fee management", false, true, true],
      ["Parent portal", false, true, true],
      ["Advanced reports", false, true, true],
      ["Custom integrations", false, false, true],
    ],
  },
  {
    title: "Communication",
    rows: [
      ["SMS notifications", false, true, true],
    ],
  },
  {
    title: "Deployment and support",
    rows: [
      ["Email support", true, true, true],
      ["Priority support", false, true, true],
      ["Dedicated success manager", false, false, true],
      ["On-premise deployment option", false, false, true],
      ["SSO & SAML", false, false, true],
      ["SLA guarantee", false, false, true],
    ],
  },
];

function Value({ v }: { v: Cell }) {
  if (v === true)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-meadow-soft text-meadow">
        <Check size={14} strokeWidth={3} aria-label="Included" />
      </span>
    );
  if (v === false)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center text-ink-faint/60">
        <Minus size={14} aria-label="Not included" />
      </span>
    );
  return <span className="text-[0.9rem] font-semibold">{v}</span>;
}

export function PlanComparison() {
  return (
    <section id="compare" className="scroll-mt-20 bg-paper">
      <div className="container-content pb-20 md:pb-28">
        <SectionHeading kicker="Compare plans" title="What's in each plan" align="center" />
        <div className="mt-12 overflow-x-auto rounded-[28px] border border-line bg-white">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Feature comparison of EduRit plans</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-2/5 px-6 py-5 text-[0.9rem] font-medium text-ink-faint">Feature</th>
                {plans.map((p) => (
                  <th key={p} scope="col" className={`px-4 py-5 text-center font-display text-lg ${p === "Standard" ? "bg-brand-soft/60 text-brand" : ""}`}>
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.title}>
                  <tr>
                    <th colSpan={4} scope="colgroup" className="bg-paper px-6 py-3 text-[0.8rem] font-semibold text-ink-soft">
                      {g.title}
                    </th>
                  </tr>
                  {g.rows.map(([label, ...vals]) => (
                    <tr key={label} className="border-t border-line">
                      <th scope="row" className="px-6 py-3.5 text-[0.93rem] font-normal">{label}</th>
                      {vals.map((v, i) => (
                        <td key={i} className={`px-4 py-3.5 text-center ${i === 1 ? "bg-brand-soft/30" : ""}`}>
                          <Value v={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
