import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { platformFeatures } from "@/app/data/site";
import { SectionHeading } from "../ui/SectionHeading";


const f = Object.fromEntries(platformFeatures.map((x) => [x.id, x]));

function Cell({
  id,
  className = "",
  children,
  dark,
  d = 0,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  dark?: boolean;
  d?: number;
}) {
  const item = f[id];
  return (
    <div
      data-reveal
      style={{ ["--d" as string]: `${d}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-[28px] border p-7 transition-all duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/10 bg-night text-white hover:shadow-[0_30px_60px_-30px_rgba(79,70,229,0.7)]"
          : "border-line bg-white hover:shadow-[0_30px_60px_-34px_rgba(15,23,43,0.45)]"
      } ${className}`}
    >
      <div className="relative flex-1">{children}</div>
      <div className="relative mt-6">
        <h3 className="text-[1.25rem]">{item.title}</h3>
        <p className={`mt-2 text-[0.95rem] leading-relaxed ${dark ? "text-white/65" : "text-ink-soft"}`}>{item.body}</p>
      </div>
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 bg-paper-sunk">
      <div className="container-content py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            kicker="Everything you need"
            title={<>One platform. <span className="text-gradient-brand">Every school need.</span></>}
            description="From student enrollment to graduation, EduRit covers every administrative and academic workflow your school depends on."
          />
          <Link data-reveal href="/features" className="inline-flex items-center gap-2 font-semibold text-brand transition-all hover:gap-3">
            Explore all features <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-6 [&>*]:min-w-0">
          {/* Student management: profile card */}
          <Cell id="students" className="md:col-span-3 lg:col-span-4" dark>
            <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative grid gap-3 sm:grid-cols-[auto_1fr]">
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 sm:flex-col sm:items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60A5FA] to-accent font-display text-lg font-extrabold">AF</span>
                <span>
                  <span className="block font-semibold">Amara Fernandes</span>
                  <span className="block text-[0.8rem] text-white/55">Class 7-B · Roll 12</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["96%", "Attendance"], ["A+", "Term grade"], ["Paid", "Fees"]].map(([v, l]) => (
                  <div key={l} className="rounded-2xl bg-white/[0.06] p-3">
                    <p className="font-display text-xl font-extrabold">{v}</p>
                    <p className="text-[0.7rem] text-white/55">{l}</p>
                  </div>
                ))}
                <div className="col-span-3 flex flex-wrap gap-1.5 rounded-2xl bg-white/[0.06] p-3 text-left text-[0.72rem]">
                  {["Academic history", "Behavior records", "Guardians", "Documents"].map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2.5 py-1 text-white/80">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Cell>

          {/* Attendance: ring */}
          <Cell id="attendance" className="md:col-span-3 lg:col-span-2" d={80}>
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ECFDF5" strokeWidth="14" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#att)" strokeWidth="14" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="18" />
                <defs>
                  <linearGradient id="att" x1="0" x2="1"><stop offset="0" stopColor="#34D399" /><stop offset="1" stopColor="#059669" /></linearGradient>
                </defs>
              </svg>
              <div>
                <p className="font-display text-[2.2rem] font-extrabold leading-none text-meadow">94.2%</p>
                <p className="mt-1 text-[0.85rem] text-ink-faint">present today</p>
              </div>
            </div>
          </Cell>

          {/* Grades */}
          <Cell id="grades" className="md:col-span-2" d={0}>
            <div className="flex h-28 items-end gap-2.5">
              {[62, 78, 70, 88, 95].map((h, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  {i === 4 && <span className="rounded-md bg-meadow-soft px-1.5 text-[0.65rem] font-bold text-meadow">A+</span>}
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand to-accent transition-all duration-500 group-hover:opacity-100" style={{ height: `${h}%`, opacity: 0.35 + i * 0.16 }} />
                </div>
              ))}
            </div>
          </Cell>

          {/* Fees */}
          <Cell id="fees" className="md:col-span-2" d={80}>
            <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-4">
              <p className="text-[0.75rem] font-semibold text-[#B45309]">Overdue accounts</p>
              <p className="mt-1 font-display text-[2.6rem] font-extrabold leading-none text-ink">−60%</p>
              <p className="mt-1 text-[0.75rem] text-ink-soft">with automated invoicing</p>
            </div>
          </Cell>

          {/* Timetable */}
          <Cell id="timetable" className="md:col-span-2" d={160}>
            <div className="grid grid-cols-5 gap-1.5" aria-hidden>
              {"MSEHMESMPSHMSEESEMHP".split("").map((k, i) => (
                <span
                  key={i}
                  className={`h-6 rounded-md ${{ M: "bg-brand/80", S: "bg-teal/80", E: "bg-accent/70", H: "bg-sun/80", P: "bg-meadow-bright/80" }[k]}`}
                />
              ))}
            </div>
            <p className="mt-3 inline-flex rounded-full bg-meadow-soft px-2.5 py-1 text-[0.72rem] font-semibold text-meadow">0 conflicts</p>
          </Cell>

          {/* Analytics */}
          <Cell id="analytics" className="md:col-span-6 lg:col-span-6" dark d={0}>
            <div aria-hidden className="absolute -left-10 -top-24 h-64 w-96 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative grid items-center gap-5 md:grid-cols-[1.4fr_1fr]">
              <svg viewBox="0 0 600 150" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="an-l" x1="0" x2="1"><stop offset="0" stopColor="#60A5FA" /><stop offset="1" stopColor="#C084FC" /></linearGradient>
                  <linearGradient id="an-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8B5CF6" stopOpacity=".35" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0" /></linearGradient>
                </defs>
                {[30, 75, 120].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />)}
                <path d="M0 110 C 60 100, 90 70, 150 78 S 250 40, 300 52 S 400 20, 460 30 S 560 12, 600 8 L600 150 L0 150 Z" fill="url(#an-f)" />
                <path d="M0 110 C 60 100, 90 70, 150 78 S 250 40, 300 52 S 400 20, 460 30 S 560 12, 600 8" fill="none" stroke="url(#an-l)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="600" cy="8" r="6" fill="#C084FC" />
              </svg>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3.5 text-[0.85rem]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay/20 text-[#FB7185]"><AlertTriangle size={16} aria-hidden /></span>
                  <span><span className="block font-semibold">4 at-risk students</span><span className="text-white/55">English · Class 8</span></span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3.5 text-[0.85rem]">
                  <span>Board report · Term 2</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[0.72rem] font-semibold text-ink">Export</span>
                </div>
              </div>
            </div>
          </Cell>
        </div>
      </div>
    </section>
  );
}
