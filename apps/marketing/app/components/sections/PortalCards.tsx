import Link from "next/link";
import { ShieldCheck, Presentation, GraduationCap, HeartHandshake, ArrowRight, Check } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { roles } from "@/app/data/roles";

const look = [
  { icon: ShieldCheck, grad: "from-brand to-accent", tint: "bg-accent-soft", text: "text-accent" },
  { icon: Presentation, grad: "from-[#60A5FA] to-brand", tint: "bg-brand-soft", text: "text-brand" },
  { icon: GraduationCap, grad: "from-[#2DD4BF] to-[#0D9488]", tint: "bg-teal-soft", text: "text-[#0D9488]" },
  { icon: HeartHandshake, grad: "from-[#FBBF24] to-[#D97706]", tint: "bg-sun-soft", text: "text-[#B45309]" },
];

export function PortalCards() {
  return (
    <section id="portals" className="scroll-mt-24 bg-paper-sunk">
      <div className="container-content py-24 md:py-32">
        <SectionHeading
          align="center"
          kicker="Built for everyone"
          title={<>A tailored experience <span className="text-gradient-brand">for every role</span></>}
          description="Four distinct portals — each designed precisely for its users. No clutter, no confusion."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r, i) => {
            const L = look[i];
            const Icon = L.icon;
            return (
              <div
                key={r.id}
                data-reveal
                style={{ ["--d" as string]: `${i * 90}ms` }}
                className="group relative flex flex-col overflow-hidden rounded-[28px] border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_60px_-34px_rgba(15,23,43,0.5)]"
              >
                <div className={`relative h-28 ${L.tint}`}>
                  <div aria-hidden className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br opacity-25 blur-xl transition-opacity group-hover:opacity-50 ${L.grad}`} />
                  <span className={`absolute bottom-0 left-6 flex h-14 w-14 translate-y-1/2 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${L.grad}`}>
                    <Icon size={24} aria-hidden />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 pt-10">
                  <h3 className="text-[1.3rem]">{r.name}</h3>
                  <p className="mt-1 text-[0.9rem] leading-snug text-ink-faint">{r.headline}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {r.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-[0.92rem]">
                        <Check size={15} strokeWidth={3} className={L.text} aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href="/demo" className={`mt-6 inline-flex items-center gap-2 text-[0.92rem] font-semibold ${L.text} transition-all hover:gap-3`}>
                    {r.cta} <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
