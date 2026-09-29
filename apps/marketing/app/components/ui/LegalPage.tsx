import { Kicker } from "./Kicker";

export type LegalSection = { id: string; title: string; body: string[] };

/** Shared layout for policy pages: sticky contents list plus readable prose column. */
export function LegalPage({
  kicker,
  title,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <section className="bg-paper">
      <div className="container-content pb-24 pt-32 md:pt-40">
        <Kicker>{kicker}</Kicker>
        <h1 className="text-4xl leading-[1.08] tracking-tight md:text-[3.2rem]">{title}</h1>
        <p className="mt-3 text-ink-faint">Last updated: {updated}</p>

        <div role="note" className="mt-8 rounded-2xl border-2 border-dashed border-accent/50 bg-accent-soft/50 p-5 text-[0.93rem] leading-relaxed">
          <strong>Draft structure.</strong> This page outlines the sections a school-data policy typically covers.
          The wording must be replaced with EduRit&rsquo;s actual policy, reviewed by a qualified lawyer, before launch.
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.8rem] font-semibold text-ink-faint">On this page</p>
            <ol className="mt-3 space-y-2 text-[0.92rem]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-soft hover:text-brand">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-2xl space-y-10">
            {sections.map((s, i) => (
              <article key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-2xl tracking-tight">
                  {i + 1}. {s.title}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="mt-3 leading-relaxed text-ink-soft">{p}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
