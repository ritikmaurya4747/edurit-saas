import Link from "next/link";
import { ArrowRight, Clock, Mail, LifeBuoy, GraduationCap, Rocket, CalendarCheck, BookOpen, Wallet, MessageCircle, Settings } from "lucide-react";
import { pageMeta } from "../lib/metadata";
import { PageHero } from "../components/ui/PageHero";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Button } from "../components/ui/Button";
import { FAQ } from "../components/faq/FAQ";
import { Book, Pencil } from "../components/illustrations/Doodles";
import { guideCategories } from "../data/resources";

export const metadata = pageMeta({
  title: "Resources",
  description: "Setup guides, help-centre articles, and support for schools running EduRit.",
  path: "/resources",
});

const catIcons = [Rocket, CalendarCheck, BookOpen, Wallet, MessageCircle, Settings];
const catTones = ["bg-accent text-white", "bg-meadow-bright text-white", "bg-teal text-night-deep", "bg-sun text-night-deep", "bg-brand text-white", "bg-brand-soft text-brand-deep"];

const firstWeek = [
  { day: "First 30 minutes", title: "School details, classes, and academic calendar" },
  { day: "Next 15 minutes", title: "Invite teachers and enroll students by CSV or email" },
  { day: "Then", title: "Link parent accounts and mark your first register" },
  { day: "Same week", title: "Fee invoices, grades, and your first circular" },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        kicker="Resources"
        title="Everything you need to get set up."
        description="Step-by-step guides for school staff, organised by the part of the school day they cover."
        cta={false}
      />

      <section id="featured" className="scroll-mt-20 bg-paper">
        <div className="container-content py-20 md:py-24">
          <div className="grid overflow-hidden rounded-[32px] bg-night text-paper lg:grid-cols-[1.1fr_1fr]">
            <div className="p-8 md:p-12">
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-[0.75rem] font-semibold text-white">Start here</span>
              <h2 className="mt-5 text-3xl leading-tight md:text-[2.4rem]">Up and running in under an hour</h2>
              <p className="mt-4 max-w-md leading-relaxed text-paper/75">
                The setup path most schools follow, from an empty account to live attendance, grades, fees, and parent messages.
              </p>
              <div className="mt-8">
                <Button href="/demo" size="lg">Get a guided setup</Button>
              </div>
            </div>
            <div className="relative bg-white/5 p-8 md:p-12">
              <Book aria-hidden className="absolute right-6 top-6 hidden w-14 text-paper/20 md:block" />
              <ol className="relative space-y-4">
                {firstWeek.map((s, i) => (
                  <li key={s.day} className="flex gap-4 rounded-2xl bg-white p-4 text-ink">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display font-bold ${["bg-sun", "bg-teal", "bg-meadow-soft", "bg-accent-soft"][i]}`}>
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-[0.75rem] font-semibold text-ink-faint">{s.day}</span>
                      <span className="block font-medium">{s.title}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="guides" className="scroll-mt-20 bg-paper-sunk">
        <div className="container-content py-20 md:py-28">
          <SectionHeading kicker="Help centre" title="Guides by topic" description="Short, practical guides written for school staff, not IT teams." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guideCategories.map((c, i) => {
              const Icon = catIcons[i];
              return (
                <div key={c.id} className="flex flex-col rounded-[28px] bg-white p-7">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${catTones[i]}`}>
                      <Icon size={20} aria-hidden />
                    </span>
                    <span>
                      <h3 className="text-lg tracking-tight">{c.title}</h3>
                      <p className="text-[0.85rem] text-ink-faint">{c.description}</p>
                    </span>
                  </div>
                  <ul className="mt-5 flex-1 divide-y divide-line border-t border-line">
                    {c.guides.map((g) => (
                      <li key={g.title}>
                        <Link href="/resources#guides" className="group flex items-center justify-between gap-3 py-3 text-[0.93rem] hover:text-brand">
                          <span>{g.title}</span>
                          <span className="flex shrink-0 items-center gap-1 text-[0.75rem] text-ink-faint">
                            <Clock size={12} aria-hidden /> {g.minutes} min
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="support" className="scroll-mt-20 bg-paper">
        <div className="container-content py-20 md:py-28">
          <SectionHeading kicker="Support" title="Stuck? Talk to a person" align="center" />
          <div className="relative mt-12 grid gap-5 md:grid-cols-3">
            <Pencil aria-hidden className="absolute -left-10 -top-10 hidden w-12 text-ink/20 lg:block" />
            {[
              { icon: Mail, title: "Email support", body: "Included on every plan. Write to us and we'll reply by email.", cta: "support@edurit.in", href: "/contact", tone: "bg-teal-soft", it: "bg-teal text-night-deep" },
              { icon: GraduationCap, title: "Staff training", body: "Onboarding materials on every plan, with live training sessions on Standard and Enterprise.", cta: "Ask about training", href: "/contact", tone: "bg-sun-soft", it: "bg-sun text-night-deep" },
              { icon: LifeBuoy, title: "Priority help", body: "Faster responses on Standard, and a dedicated success manager on Enterprise.", cta: "Compare plans", href: "/pricing#compare", tone: "bg-accent-soft", it: "bg-accent text-white" },
            ].map(({ icon: Icon, ...c }) => (
              <div key={c.title} className={`rounded-[28px] p-7 ${c.tone}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.it}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="mt-5 text-xl tracking-tight">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{c.body}</p>
                <Link href={c.href} className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand hover:gap-2.5 transition-all">
                  {c.cta} <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
    </>
  );
}
