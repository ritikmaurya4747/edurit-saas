import { CalendarCheck, BookOpen, MessageCircle, IndianRupee, LayoutDashboard, BellRing, Check } from "lucide-react";
import { Kicker } from "../ui/Kicker";

/** Scroll story: one school day, hour by hour. Driven by [data-story] in lib/effects.ts. */
const steps = [
  {
    time: "08:05",
    label: "First period",
    icon: CalendarCheck,
    tone: "from-[#34D399] to-[#059669]",
    title: "The register is done before the bell stops ringing.",
    body: "Ms. Desai marks Class 7-B from her phone in seconds. Parents of the two absent students are notified automatically.",
    ui: "attendance",
  },
  {
    time: "10:30",
    label: "Mid-morning",
    icon: BookOpen,
    tone: "from-[#60A5FA] to-brand",
    title: "Marks go in once. Everything else updates itself.",
    body: "Unit-test scores become the gradebook, the report card, and the parent's view — no re-typing, no spreadsheet at term-end.",
    ui: "grades",
  },
  {
    time: "12:15",
    label: "Lunch break",
    icon: MessageCircle,
    tone: "from-[#A78BFA] to-accent",
    title: "One circular. Every parent. Read receipts roll in.",
    body: "The Sports Day notice reaches every family instantly, and the office can see exactly who has read it.",
    ui: "message",
  },
  {
    time: "14:00",
    label: "Afternoon",
    icon: IndianRupee,
    tone: "from-[#FBBF24] to-[#D97706]",
    title: "A fee paid from a phone. The receipt is already sent.",
    body: "Mr. Rao pays Term 3 online. The ledger reconciles itself and the outstanding balance updates for the accounts team.",
    ui: "fee",
  },
  {
    time: "16:30",
    label: "End of day",
    icon: LayoutDashboard,
    tone: "from-[#F472B6] to-[#DB2777]",
    title: "The principal sees the whole day on one screen.",
    body: "Attendance, collections, and the students who need attention — without chasing a single report.",
    ui: "summary",
  },
];

function StepUI({ kind }: { kind: string }) {
  const card = "rounded-2xl border border-line bg-white p-4 text-[0.82rem] shadow-[0_20px_40px_-28px_rgba(15,23,43,0.45)]";
  if (kind === "attendance")
    return (
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Class 7-B · Period 1</span>
          <span className="rounded-full bg-meadow-soft px-2 py-0.5 text-[0.7rem] font-bold text-meadow">28 / 30</span>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className={`aspect-square rounded-md ${i === 13 || i === 22 ? "bg-clay/80" : "bg-meadow-bright/80"}`} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-ink-faint"><BellRing size={13} aria-hidden /> 2 parents notified at 8:06 am</p>
      </div>
    );
  if (kind === "grades")
    return (
      <div className={card}>
        <p className="font-semibold">Maths · Unit test 3</p>
        {[["Amara F.", 92], ["Rohan B.", 78], ["Sara I.", 88], ["Devansh R.", 95]].map(([n, v]) => (
          <div key={n as string} className="mt-2.5 flex items-center gap-3">
            <span className="w-20 text-ink-soft">{n}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-sunk">
              <span className="block h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${v}%` }} />
            </span>
            <span className="w-8 text-right font-semibold tabular-nums">{v}</span>
          </div>
        ))}
        <p className="mt-3 flex items-center gap-2 text-meadow"><Check size={13} aria-hidden /> Report cards updated</p>
      </div>
    );
  if (kind === "message")
    return (
      <div className={card}>
        <div className="rounded-xl bg-gradient-to-br from-brand to-accent p-3 text-white">
          <p className="text-[0.7rem] font-semibold opacity-80">Circular · Annual Sports Day</p>
          <p className="mt-1 leading-snug">Sports Day is on Saturday. Students report by 7:30 am in house T-shirts.</p>
        </div>
        <div className="mt-3 flex items-center justify-between text-ink-soft">
          <span>Read by parents</span>
          <span className="font-semibold text-ink">1,184 / 1,240</span>
        </div>
        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-paper-sunk">
          <span className="block h-full w-[95%] rounded-full bg-meadow-bright" />
        </span>
      </div>
    );
  if (kind === "fee")
    return (
      <div className={card}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Payment receipt</span>
          <span className="rounded-full bg-meadow-soft px-2 py-0.5 text-[0.7rem] font-bold text-meadow">Paid</span>
        </div>
        <p className="mt-3 font-display text-[1.8rem] font-extrabold leading-none">₹8,400</p>
        <p className="mt-1 text-ink-faint">Devansh Rao · Term 3 · UPI</p>
        <div className="mt-3 border-t border-dashed border-line pt-3 text-ink-soft">Receipt #ER-20417 emailed to parent</div>
      </div>
    );
  return (
    <div className={card}>
      <p className="font-semibold">Today at a glance</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[["94.2%", "Attendance", "text-meadow"], ["₹3.2L", "Collected", "text-brand"], ["4", "Need attention", "text-clay"]].map(([v, l, c]) => (
          <div key={l} className="rounded-xl bg-paper p-2.5">
            <p className={`font-display text-lg font-extrabold ${c}`}>{v}</p>
            <p className="text-[0.68rem] text-ink-faint">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayStory() {
  return (
    <section className="relative bg-paper">
      <div data-story className="container-content grid gap-12 py-24 md:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 [&>*]:min-w-0">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <div data-reveal>
            <Kicker>A day with EduRit</Kicker>
            <h2 className="text-[2.2rem] leading-[1.06] sm:text-[2.8rem] md:text-[3.3rem]">
              Every hour of the school day, <span className="text-gradient-brand">handled.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Follow one ordinary school day — and everything that no longer needs a register, a ledger, or a phone call.
            </p>
          </div>

          {/* the clock */}
          <div className="mt-10 hidden items-center gap-6 rounded-[28px] bg-night p-6 text-white shadow-[0_30px_60px_-30px_rgba(15,23,43,0.8)] lg:flex">
            <div className="relative h-24 w-1.5 overflow-hidden rounded-full bg-white/10">
              <span data-story-bar className="absolute inset-x-0 top-0 block h-1/5 rounded-full bg-gradient-to-b from-brand to-accent transition-[height] duration-500" />
            </div>
            <div>
              <p data-story-label className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-white/50">First period</p>
              <p data-story-clock className="font-display text-[4rem] font-extrabold leading-none tabular-nums tracking-tight">08:05</p>
            </div>
          </div>
        </div>

        <ol className="relative space-y-6 lg:space-y-10 lg:py-[8vh]">
          {steps.map(({ icon: Icon, ...s }, i) => (
            <li
              key={s.time}
              data-step
              data-time={s.time}
              data-label={s.label}
              className={`grid gap-5 rounded-[32px] border border-line bg-white/70 p-6 backdrop-blur md:grid-cols-[1fr_1fr] md:p-8 [&>*]:min-w-0 ${i === 0 ? "is-active" : ""}`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${s.tone}`}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="font-display text-lg font-extrabold tabular-nums text-ink-faint">{s.time}</span>
                </div>
                <h3 className="mt-5 text-[1.35rem] leading-snug">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{s.body}</p>
              </div>
              <div className="self-center">
                <StepUI kind={s.ui} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
