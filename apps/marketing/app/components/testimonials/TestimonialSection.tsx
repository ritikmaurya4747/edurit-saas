import { testimonials } from "@/app/data/testimonials";
import { Quote } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";

const initials = (n: string) => n.replace(/^(Dr|Mr|Mrs|Ms)\.\s*/, "").split(" ").map((x) => x[0]).join("").slice(0, 2);
const grads = ["from-brand to-accent", "from-[#2DD4BF] to-brand", "from-[#FBBF24] to-[#DB2777]"];

export function TestimonialSection() {
  const [lead, ...rest] = testimonials;
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px]" />
      </div>
      <div className="container-content py-24 md:py-32">
        <SectionHeading dark align="center" kicker="What they say" title={<>Loved by schools, teachers, <span className="text-gradient">and parents</span></>} />

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <figure data-reveal className="relative flex flex-col justify-between rounded-[32px] bg-gradient-to-br from-brand to-accent p-8 md:p-12">
            <Quote size={56} className="absolute right-8 top-8 text-white/15" aria-hidden />
            <div>
              <blockquote className="font-display text-[1.5rem] font-bold leading-snug md:text-[2rem]">&ldquo;{lead.quote}&rdquo;</blockquote>
            </div>
            <figcaption className="mt-10 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 font-display font-extrabold">{initials(lead.name)}</span>
              <span><span className="block font-semibold">{lead.name}</span><span className="text-white/75">{lead.role}</span></span>
            </figcaption>
          </figure>
          <div className="grid gap-5">
            {rest.map((t, i) => (
              <figure key={t.name} data-reveal style={{ ["--d" as string]: `${(i + 1) * 100}ms` }} className="glass flex flex-col justify-between rounded-[28px] p-7">
                <blockquote className="text-[1.05rem] leading-relaxed text-white/85">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-display text-[0.85rem] font-extrabold ${grads[i + 1]}`}>{initials(t.name)}</span>
                  <span className="text-[0.9rem]"><span className="block font-semibold">{t.name}</span><span className="text-white/60">{t.role}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
