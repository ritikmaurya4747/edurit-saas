import { Heart, Clock3, ShieldCheck, Users } from "lucide-react";
import { pageMeta } from "../lib/metadata";
import { PageHero } from "../components/ui/PageHero";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Button } from "../components/ui/Button";
import { APlus, Book, Star } from "../components/illustrations/Doodles";
import { FinalCTA } from "../components/sections/FinalCTA";
import { stats } from "../data/site";

export const metadata = pageMeta({
  title: "About us",
  description: "Why we build EduRit: giving teachers and school staff their time back from registers, ledgers, and paperwork.",
  path: "/about",
});

const principles = [
  { icon: Clock3, title: "Time back for teachers", body: "Every screen is judged by one question: does this give a teacher more time with students, or less?", tone: "bg-sun text-night-deep" },
  { icon: Users, title: "Built for everyone at school", body: "Principals, class teachers, office staff, and parents all use EduRit. None of them should need training to do a daily task.", tone: "bg-teal text-night-deep" },
  { icon: ShieldCheck, title: "Careful with student data", body: "Schools hand us records about children. We treat access, privacy, and backups as part of the product, not an add-on.", tone: "bg-brand text-white" },
  { icon: Heart, title: "Honest about what we do", body: "We'd rather show you the product running with your own classes than make claims on a website.", tone: "bg-accent text-white" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About us"
        title="We build software for the people who run schools."
        description="EduRit Technologies builds the complete school management platform — to streamline operations, empower educators, and enhance student outcomes."
        cta={false}
      />

      <section className="bg-paper">
        <div className="container-content grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 [&>*]:min-w-0">
          <div>
            <SectionHeading
              kicker="Why EduRit exists"
              title="A school's best hours shouldn't go to paperwork"
            />
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-soft">
              <p>
                Walk into most staff rooms and you&rsquo;ll find the same thing: an attendance register filled by
                hand, a fee ledger kept by one person, marks in a dozen different notebooks, and notices that
                may or may not make it home.
              </p>
              <p>
                None of that work is unimportant. It&rsquo;s just done three times over, by people who would rather
                be teaching. EduRit exists to do it once — and put the result wherever it&rsquo;s needed.
              </p>
            </div>
          </div>
          <div className="relative">
            <APlus aria-hidden className="absolute -left-6 -top-8 hidden w-14 text-ink/20 md:block" />
            <Star aria-hidden className="absolute -bottom-6 right-4 hidden w-10 text-ink/20 md:block" />
            <figure className="relative rounded-[32px] bg-brand p-8 text-white md:p-12">
              <Book aria-hidden className="w-12 text-white/40" />
              <blockquote className="mt-6 font-display text-[1.6rem] font-bold leading-snug md:text-[2rem]">
                &ldquo;Give teachers less admin work and more time to teach.&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-white/70">The idea every EduRit feature starts from</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section aria-label="EduRit in numbers" className="bg-night text-paper">
        <div className="container-content py-14">
          <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-paper/70">{s.label}</dt>
                <dd className={`font-display text-[2.6rem] font-bold leading-none ${["text-sun", "text-accent", "text-teal", "text-white"][i]}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-paper-sunk">
        <div className="container-content py-20 md:py-28">
          <SectionHeading kicker="What we believe" title="Four principles behind the product" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {principles.map(({ icon: Icon, ...p }) => (
              <div key={p.title} className="rounded-[28px] bg-white p-8">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${p.tone}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="mt-5 text-xl tracking-tight">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-content py-20 md:py-24">
          <div className="grid items-center gap-8 rounded-[32px] border border-line bg-white p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div>
              <h2 className="text-2xl leading-tight md:text-[2rem]">Want to work with us, or partner with us?</h2>
              <p className="mt-3 max-w-xl text-ink-soft">
                We&rsquo;re always glad to hear from educators, school groups, and partners who care about the same problem.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/contact" size="lg">Get in touch</Button>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
