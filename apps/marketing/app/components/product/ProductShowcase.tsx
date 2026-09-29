import { coreFeatures } from "@/app/data/features";
import { mockById } from "./mockups";
import { SectionHeading } from "../ui/SectionHeading";
import { TabGroup } from "../ui/TabGroup";

export function ProductShowcase() {
  const panels = Object.fromEntries(
    coreFeatures.map((f) => {
      const Mock = mockById[f.id];
      return [
        f.id,
        <div
          key={f.id}
          className="mt-8 grid items-center gap-10 rounded-[32px] bg-white p-6 shadow-[0_2px_0_#E2E8F0] md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 [&>*]:min-w-0"
        >
          <div>
            <h3 className="text-2xl leading-tight tracking-tight md:text-[2rem]">{f.title}</h3>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">{f.description}</p>
            <ul className="mt-6 space-y-3">
              {f.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[0.95rem]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-white">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-paper p-4">
              <p className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-brand">{f.stat.value}</p>
              <p className="text-[0.85rem] leading-snug text-ink-soft">{f.stat.label}</p>
            </div>
          </div>
          <div className="relative">
            <span aria-hidden className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-sun/80" />
            <div className="relative">
              <Mock />
            </div>
          </div>
        </div>,
      ];
    })
  );

  return (
    <section id="product" className="scroll-mt-24 bg-paper">
      <div className="container-content py-20 md:py-28">
        <SectionHeading
          kicker="One platform"
          title="Every school workflow, in one system"
          description="Pick a part of the school day. The screen you see is the same connected record underneath."
        />
        <TabGroup
          label="Product modules"
          tabs={coreFeatures.map((f) => ({ id: f.id, label: f.label }))}
          panels={panels}
          listClassName="mt-10 flex gap-2 overflow-x-auto pb-1 md:mt-12"
          tabClassName="shrink-0 rounded-full px-5 py-2.5 text-[0.92rem] font-medium transition-all"
          activeClassName="bg-brand text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.7)]"
          inactiveClassName="bg-white text-ink-soft hover:text-ink border border-line"
        />
      </div>
    </section>
  );
}
