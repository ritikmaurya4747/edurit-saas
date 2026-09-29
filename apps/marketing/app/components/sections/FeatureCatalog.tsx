import { BookOpen, CalendarCheck, Wallet, MessageCircle, CalendarDays, BarChart3 } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { catalog } from "@/app/data/catalog";


const icons = { academics: BookOpen, attendance: CalendarCheck, fees: Wallet, communication: MessageCircle, administration: CalendarDays, insights: BarChart3 };
const tones = ["bg-teal text-night-deep", "bg-meadow-bright text-white", "bg-sun text-night-deep", "bg-accent text-white", "bg-brand-soft text-brand-deep", "bg-brand text-white"];

export function FeatureCatalog() {
  return (
    <section id="all-features" className="scroll-mt-20 bg-paper">
      <div className="container-content py-20 md:py-28">
        <SectionHeading
          kicker="Everything included"
          title="The full feature list"
          description="Every module works from the same student record, so switching one on never means setting up data twice."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((g, i) => {
            const Icon = icons[g.id as keyof typeof icons];
            return (
              <div key={g.id} className="rounded-[28px] border border-line bg-white p-7 transition-shadow hover:shadow-[0_24px_40px_-28px_rgba(15,23,43,0.4)]">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[i]}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="mt-5 text-xl tracking-tight">{g.title}</h3>
                <p className="mt-1 text-[0.92rem] text-ink-soft">{g.description}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-5">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[0.92rem]">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-meadow-soft text-[9px] font-bold text-meadow">✓</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
