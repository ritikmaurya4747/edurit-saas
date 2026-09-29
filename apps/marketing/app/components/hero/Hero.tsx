import Link from "next/link";
import { BellRing, IndianRupee, FileCheck2, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { DashboardMock } from "../product/mockups";
import { stats } from "@/app/data/site";
import { CampusLine } from "../illustrations/CampusLine";


const live = [
  { icon: BellRing, tone: "bg-clay/15 text-[#FB7185]", title: "Sara Iyer marked absent", meta: "Parent notified · 8:12 am" },
  { icon: IndianRupee, tone: "bg-meadow/20 text-[#34D399]", title: "₹8,400 fee received", meta: "Devansh Rao · Term 3 · UPI" },
  { icon: FileCheck2, tone: "bg-brand/20 text-[#93C5FD]", title: "Report cards ready", meta: "Class 7-B · 34 students" },
  { icon: MessageCircle, tone: "bg-accent/20 text-[#C4B5FD]", title: "Sports Day circular read", meta: "1,184 of 1,240 parents" },
];

function parseStat(v: string) {
  const m = v.match(/^([\d.]+)(.*)$/);
  return m ? { n: m[1], suffix: m[2], dec: m[1].includes(".") ? m[1].split(".")[1].length : 0 } : null;
}

export function Hero() {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      {/* aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[10%] -top-[20%] h-[70vh] w-[60vw] rounded-full bg-brand/40 blur-[120px] animate-aurora" />
        <div className="absolute -right-[10%] top-[5%] h-[60vh] w-[50vw] rounded-full bg-accent/40 blur-[120px] animate-aurora-slow" />
        <div className="absolute bottom-[10%] left-[30%] h-[40vh] w-[40vw] rounded-full bg-[#DB2777]/20 blur-[120px] animate-aurora" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_30%,black_20%,transparent_70%)]" />
      </div>

      <div className="container-content relative pt-32 text-center sm:pt-36 md:pt-44">
        <Link
          href="/features#all-features"
          className="glass mx-auto inline-flex animate-rise items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[0.85rem] text-white/85 transition-colors hover:bg-white/[0.12]"
        >
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-brand to-accent px-2.5 py-1 text-[0.72rem] font-semibold text-white">
            <Sparkles size={12} aria-hidden /> New
          </span>
          AI-powered grade analytics
          <ArrowRight size={14} aria-hidden />
        </Link>

        <h1 className="mx-auto mt-8 max-w-5xl animate-rise text-[2.9rem] leading-[1.02] [animation-delay:80ms] sm:text-[4.2rem] md:text-[5.2rem] lg:text-[6rem]">
          Run your school.
          <br />
          <span className="text-gradient">
            Not the{" "}
            <span data-rotate='["paperwork.","registers.","spreadsheets.","phone calls."]'>paperwork.</span>
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl animate-rise text-lg leading-relaxed text-white/70 [animation-delay:160ms] md:text-xl">
          EduRit unifies student management, attendance, grades, fees, and communication — giving every school
          stakeholder a personalized, role-based experience.
        </p>

        <div className="mt-10 flex animate-rise flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
          <Link
            href="/demo"
            className="group relative inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-semibold text-ink shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_20px_50px_-12px_rgba(139,92,246,0.8)] transition-transform hover:-translate-y-0.5"
          >
            Get started free
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={15} aria-hidden />
            </span>
          </Link>
          <Link href="/solutions#roles" className="glass inline-flex items-center rounded-full px-7 py-4 font-semibold text-white transition-colors hover:bg-white/[0.12]">
            View demo dashboards
          </Link>
        </div>

        <ul className="mt-7 flex animate-rise flex-wrap justify-center gap-x-6 gap-y-2 text-[0.9rem] text-white/60 [animation-delay:320ms]">
          {["Free 30-day trial", "No credit card required", "Setup in 30 min"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-meadow-bright/25 text-[9px] text-[#34D399]">✓</span>
              {t}
            </li>
          ))}
        </ul>

        {/* product stage */}
        <div className="relative mx-auto mt-16 max-w-[1040px] animate-rise [animation-delay:400ms] md:mt-20">
          <div aria-hidden className="absolute -inset-x-10 -bottom-10 top-10 rounded-[48px] bg-gradient-to-r from-brand/50 via-accent/50 to-[#DB2777]/40 blur-[70px]" />
          <div data-tilt="16" className="relative rounded-[22px] bg-gradient-to-b from-white/30 to-white/5 p-[1.5px] text-left">
            <div className="overflow-hidden rounded-[21px] bg-white text-ink">
              <DashboardMock />
            </div>
          </div>

          {/* live activity */}
          <div className="absolute -left-3 top-[18%] z-10 hidden w-[270px] text-left md:block lg:-left-16">
            <div className="border border-white/10 bg-[#0F172B]/95 backdrop-blur-xl mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-[#34D399]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
              </span>
              Live at school
            </div>
            <div data-cycle="2600" className="relative h-[76px]">
              {live.map(({ icon: Icon, ...n }, i) => (
                <div key={n.title} className={`border border-white/10 bg-[#0F172B]/95 backdrop-blur-xl absolute${i === 0 ? " is-on" : ""} inset-x-0 top-0 flex items-center gap-3 rounded-2xl p-3.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.tone}`}>
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 leading-snug">
                    <span className="block truncate text-[0.88rem] font-semibold text-white">{n.title}</span>
                    <span className="block truncate text-[0.75rem] text-white/60">{n.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-[#0F172B]/95 backdrop-blur-xl absolute -right-3 bottom-[16%] z-10 hidden animate-float rounded-2xl p-4 text-left shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] md:block lg:-right-14">
            <p className="text-[0.72rem] text-white/60">Attendance today</p>
            <p className="font-display text-[1.9rem] font-extrabold leading-none text-[#34D399]">94.2%</p>
            <p className="mt-1 text-[0.72rem] text-white/60">2,673 / 2,847 present</p>
          </div>
        </div>

        {/* stats */}
        <dl className="relative mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-y-8 md:grid-cols-4">
          {stats.map((s, i) => {
            const p = parseStat(s.value);
            return (
              <div key={s.label} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} className="flex flex-col-reverse md:border-l md:border-white/10 md:first:border-l-0">
                <dt className="mt-1 text-[0.9rem] text-white/55">{s.label}</dt>
                <dd className="font-display text-[2.4rem] font-extrabold leading-none md:text-[2.9rem]">
                  {p ? (
                    <span data-count={p.n} data-decimals={p.dec} data-suffix={p.suffix}>
                      {s.value}
                    </span>
                  ) : (
                    s.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <CampusLine id="hero-cl" className="relative mt-10 block h-[140px] w-full md:h-[220px]" />
    </section>
  );
}
