import { Baby, School, Building2 } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { Button } from "../ui/Button";

const types = [
  {
    icon: Baby,
    title: "Pre-primary and primary",
    body: "Quick daily registers, clear progress reports, and a parent app that keeps young families closely involved.",
    points: ["Daily attendance with instant alerts", "Progress reports parents actually read", "Circulars and event reminders"],
    tone: "bg-sun-soft",
    icon_tone: "bg-sun text-night-deep",
  },
  {
    icon: School,
    title: "Secondary and higher secondary",
    body: "Subject-wise gradebooks, weighted assessments, and timetables that handle electives, labs, and substitutions.",
    points: ["Weighted marks and report cards", "Conflict-free timetables", "Performance trends by subject"],
    tone: "bg-teal-soft",
    icon_tone: "bg-teal text-night-deep",
  },
  {
    icon: Building2,
    title: "School groups and trusts",
    body: "Run several campuses under one account, with shared reporting for management and separate day-to-day data for each school.",
    points: ["Multi-school management (Enterprise)", "Group-level dashboards", "Dedicated success manager"],
    tone: "bg-brand-soft",
    icon_tone: "bg-brand text-white",
  },
];

export function SchoolTypes() {
  return (
    <section id="school-types" className="scroll-mt-20 bg-paper">
      <div className="container-content py-20 md:py-28">
        <SectionHeading
          kicker="Every kind of school"
          title="From a single primary school to a group of campuses"
          description="The same platform, configured for how your school is organised."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {types.map(({ icon: Icon, ...t }) => (
            <div key={t.title} className={`flex flex-col rounded-[32px] p-8 ${t.tone}`}>
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.icon_tone}`}>
                <Icon size={26} aria-hidden />
              </span>
              <h3 className="mt-6 text-[1.4rem] leading-tight tracking-tight">{t.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{t.body}</p>
              <ul className="mt-6 space-y-2.5 border-t border-ink/10 pt-6">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[0.93rem]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-meadow">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-line bg-white p-6 md:p-8">
          <p className="max-w-xl font-display text-xl font-bold leading-snug">
            Not sure which setup fits your school? We&rsquo;ll walk through it with your own class structure.
          </p>
          <Button href="/demo" size="lg">Book a demo</Button>
        </div>
      </div>
    </section>
  );
}
