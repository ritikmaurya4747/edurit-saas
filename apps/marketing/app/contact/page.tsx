import Link from "next/link";
import { Mail, LifeBuoy, CalendarCheck, ArrowRight } from "lucide-react";
import { pageMeta } from "../lib/metadata";
import { Kicker } from "../components/ui/Kicker";
import { CampusLine } from "../components/illustrations/CampusLine";
import { Aurora } from "../components/ui/PageHero";
import { FAQ } from "../components/faq/FAQ";
import { ContactForm } from "./ContactForm";

export const metadata = pageMeta({
  title: "Contact",
  description: "Talk to the EduRit team about pricing, moving from another system, or support for your school.",
  path: "/contact",
});

const channels = [
  { icon: Mail, title: "Sales", body: "Plans, pricing, and school groups", value: "sales..edurit.in", tone: "bg-brand text-white" },
  { icon: LifeBuoy, title: "Support", body: "Help with an existing account", value: "support..edurit.in", tone: "bg-accent text-white" },
];

export default function ContactPage() {
  return (
    <>
      <section className="grain relative isolate overflow-hidden bg-night text-white">
        <Aurora />
        <div className="container-content relative z-10 grid gap-12 pb-6 pt-32 md:pt-40 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 [&>*]:min-w-0">
          <div>
            <Kicker dark>Contact</Kicker>
            <h1 className="text-4xl leading-[1.08] tracking-tight md:text-[3.4rem]">Talk to <span className="text-gradient">our team.</span></h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              Comparing options or ready to move off spreadsheets? Tell us about your school and we&rsquo;ll reply within one business day.
            </p>
            <ul className="mt-10 space-y-4">
              {channels.map(({ icon: Icon, ...c }) => (
                <li key={c.title} className="glass flex items-center gap-4 rounded-2xl p-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-bold">{c.title}</span>
                    <span className="block text-[0.85rem] text-white/60">{c.body}</span>
                    <a href={`mailto:${c.value}`} className="font-semibold text-[#93C5FD] hover:underline">{c.value}</a>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/demo" className="group mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-brand to-accent p-4 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun text-night-deep">
                <CalendarCheck size={20} aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-display font-bold">Prefer to see it first?</span>
                <span className="block text-[0.85rem] text-white/80">Book a 30-minute walkthrough</span>
              </span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <ContactForm />
        </div>
        <CampusLine id="contact-cl" className="relative mt-4 block h-[110px] w-full md:h-[180px]" />
      </section>
      <FAQ />
    </>
  );
}
