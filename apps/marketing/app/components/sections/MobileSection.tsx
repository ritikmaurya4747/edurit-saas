import { Globe } from "../illustrations/Doodles";
import { PhoneMock } from "../product/mockups/PhoneMock";
import { Kicker } from "../ui/Kicker";


const points = [
  { title: "For parents", body: "Attendance, marks, fees, and notices for every child in one login." },
  { title: "For teachers", body: "Mark a register or enter marks between periods, from a phone." },
  { title: "For leaders", body: "Check today's attendance and collection without opening a laptop." },
];

export function MobileSection() {
  return (
    <section id="mobile" className="scroll-mt-20 overflow-hidden bg-night text-paper">
      <div className="container-content grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <div className="[&_div.text-ink-soft]:text-paper/75">
            <Kicker>Works on any device</Kicker>
          </div>
          <h2 className="text-3xl leading-[1.12] md:text-[2.75rem]">School in your pocket, for every family</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-paper/75">
            Most of a school&rsquo;s day happens away from a desk. EduRit is designed mobile-first, so the
            people who use it most can do it from the phone they already carry.
          </p>
          <ul className="mt-10 space-y-5">
            {points.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold ${["bg-accent", "bg-sun text-night-deep", "bg-teal text-night-deep"][i]}`}>
                  {i + 1}
                </span>
                <span>
                  <span className="block font-display text-lg font-bold">{p.title}</span>
                  <span className="text-paper/70">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex justify-center py-6">
          <span aria-hidden className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/40" />
          <span aria-hidden className="absolute right-[12%] top-4 h-20 w-20 rounded-full bg-sun" />
          <span aria-hidden className="absolute bottom-10 left-[14%] h-12 w-12 rounded-full bg-accent" />
          <Globe aria-hidden className="absolute bottom-6 right-[10%] hidden w-14 text-paper/30 md:block" />
          <div className="relative">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}
