import { SectionHeading } from "../ui/SectionHeading";

const steps = [
  { title: "Set up your school", description: "Enter your school details, create classes, and define your academic calendar in under 30 minutes." },
  { title: "Invite your team", description: "Send bulk invitations to teachers, enroll students, and link parent accounts — all via CSV or email." },
  { title: "Start managing", description: "Mark attendance, enter grades, collect fees, and communicate — everything from one clean dashboard." },
];

export function HowItWorks() {
  return (
    <section className="bg-paper">
      <div className="container-content py-20 md:py-28">
        <SectionHeading
          kicker="Simple setup"
          title="Up and running in under an hour"
          description="No lengthy implementation project — three steps from sign-up to your first attendance register."
        />

        {/* ruled exercise-book page */}
        <div className="relative mt-12 overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_48px_-32px_rgba(15,23,43,0.35)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_35px,#E0F2FE_36px)]"
          />
          <div aria-hidden className="absolute bottom-0 left-12 top-0 w-[2px] bg-accent/50 md:left-16" />
          <div aria-hidden className="absolute left-4 top-0 hidden h-full flex-col justify-around py-10 md:flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-4 w-4 rounded-full bg-paper-sunk shadow-inner" />
            ))}
          </div>

          <ol className="relative grid gap-10 py-10 pl-20 pr-6 md:grid-cols-3 md:py-14 md:pl-28 md:pr-12">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
