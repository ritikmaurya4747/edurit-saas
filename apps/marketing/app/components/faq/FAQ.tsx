import { faqs } from "@/app/data/faqs";
import { SectionHeading } from "../ui/SectionHeading";

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-paper-sunk">
      <div className="container-content py-20 md:py-28">
        <SectionHeading kicker="Questions" title="Before you switch" align="center" />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.05rem]">
                {faq.question}
                <span
                  aria-hidden
                  className="shrink-0 text-xl text-ink-faint transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
