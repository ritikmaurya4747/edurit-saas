import { pageMeta } from "../lib/metadata";
import { Kicker } from "../components/ui/Kicker";
import { CampusLine } from "../components/illustrations/CampusLine";
import { Aurora } from "../components/ui/PageHero";
import { DemoForm } from "./DemoForm";

export const metadata = pageMeta({
  title: "Book a demo",
  description: "See EduRit walked through with your own classes and staff in a 30-minute session.",
  path: "/demo",
});

const agenda = [
  { time: "5 min", title: "Your school today", body: "How attendance, fees, and marks are handled now." },
  { time: "15 min", title: "EduRit with your classes", body: "A walkthrough built around your own structure." },
  { time: "10 min", title: "Moving over and pricing", body: "Data import, training, and the right plan for your size." },
];

const bring = ["A rough student and staff count", "How you track fees today", "The questions your team keeps asking"];

export default function DemoPage() {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <Aurora />
      <div className="container-content relative z-10 grid gap-12 pb-6 pt-32 md:pt-40 lg:grid-cols-[1fr_1.05fr] lg:gap-16 [&>*]:min-w-0">
        <div>
          <Kicker dark>Book a demo</Kicker>
          <h1 className="text-4xl leading-[1.08] tracking-tight md:text-[3.4rem]">
            See it running with <span className="text-gradient">your own school.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
            A 30-minute session with our team, built around your classes and workflows — not a generic script.
          </p>

          <h2 className="mt-10 font-display text-xl font-bold">What happens in the 30 minutes</h2>
          <ol className="relative mt-5 space-y-4 border-l-2 border-dashed border-white/20 pl-7">
            {agenda.map((a, i) => (
              <li key={a.title} className="relative">
                <span className={`absolute -left-[42px] top-0 flex h-7 w-7 items-center justify-center rounded-full text-[0.75rem] font-bold ${["bg-sun text-night-deep", "bg-accent text-white", "bg-brand text-white"][i]}`}>
                  {i + 1}
                </span>
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-lg font-bold">{a.title}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.72rem] font-semibold text-white/70">{a.time}</span>
                </p>
                <p className="text-white/65">{a.body}</p>
              </li>
            ))}
          </ol>

          <div className="glass mt-10 rounded-2xl p-5">
            <p className="font-display font-bold">Helpful to have ready</p>
            <ul className="mt-3 space-y-2 text-[0.93rem]">
              {bring.map((b) => (
                <li key={b} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meadow-bright/25 text-[11px] font-bold text-[#34D399]">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lg:pt-6">
          <DemoForm />
        </div>
      </div>
      <CampusLine id="demo-cl" className="relative mt-4 block h-[110px] w-full md:h-[180px]" />
    </section>
  );
}
