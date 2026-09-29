import Link from "next/link";
import { ShieldCheck, Presentation, GraduationCap, HeartHandshake, ArrowRight } from "lucide-react";
import { roles } from "@/app/data/roles";
import { cn } from "@/app/lib/utils";
import { SectionHeading } from "../ui/SectionHeading";
import { TabGroup } from "../ui/TabGroup";


const icons = [ShieldCheck, Presentation, GraduationCap, HeartHandshake];
const tones = ["bg-brand text-white", "bg-accent text-white", "bg-teal text-night-deep", "bg-meadow-bright text-white"];

export function RoleBasedSolutions() {
  const tabs = roles.map((r, i) => {
    const Icon = icons[i];
    return {
      id: r.id,
      label: (
        <>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[i])}>
            <Icon size={18} aria-hidden />
          </span>
          {r.name}
        </>
      ),
    };
  });

  const panels = Object.fromEntries(
    roles.map((r, i) => {
      const Icon = icons[i];
      return [
        r.id,
        <div key={r.id} className="rounded-[32px] bg-white p-7 md:p-10">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", tones[i])}>
            <Icon size={26} aria-hidden />
          </span>
          <p className="mt-6 text-sm font-medium text-ink-faint">{r.name} portal</p>
          <h3 className="mt-2 text-2xl leading-tight tracking-tight md:text-[2rem]">{r.headline}</h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{r.description}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {r.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-[0.95rem]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-white">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <Link href="/demo" className="mt-8 inline-flex items-center gap-2 font-semibold text-brand transition-all hover:gap-3">
            {r.cta} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>,
      ];
    })
  );

  return (
    <section id="roles" className="scroll-mt-20 bg-paper-sunk">
      <div className="container-content py-20 md:py-28">
        <SectionHeading
          kicker="Built for everyone"
          title="A tailored experience for every role"
          description="Four distinct portals — each designed precisely for its users. No clutter, no confusion."
        />
        <TabGroup
          label="Roles"
          vertical
          tabs={tabs}
          panels={panels}
          className="mt-12 grid gap-8 lg:grid-cols-[320px_1fr] [&>*]:min-w-0"
          listClassName="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:row-span-4"
          tabClassName="flex shrink-0 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[0.95rem] font-medium transition-all"
          activeClassName="border-brand bg-white shadow-[0_12px_24px_-16px_rgba(37,99,235,0.6)]"
          inactiveClassName="border-transparent hover:bg-white/70"
        />
      </div>
    </section>
  );
}
