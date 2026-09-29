const before = [
  "Attendance marked on paper, entered again later",
  "Fee receipts written by hand at the counter",
  "Circulars sent home in a school bag",
  "Report cards compiled by hand at term-end",
];

const after = [
  "Attendance marked once, everywhere it's needed",
  "Receipts generated automatically on payment",
  "Circulars delivered with read confirmation",
  "Report cards ready the moment marks are entered",
];

const chalk = [
  { t: "a² + b² = c²", c: "left-[6%] top-[10%] rotate-[-6deg] text-2xl" },
  { t: "ABC", c: "right-[8%] top-[8%] rotate-[4deg] text-3xl" },
  { t: "H₂O", c: "left-[18%] bottom-[3%] text-lg" },
  { t: "7 × 8 = 56", c: "right-[16%] bottom-[3%] rotate-[-3deg] text-lg" },
];

export function AutomationSection() {
  return (
    <section className="bg-paper">
      <div className="container-content py-20 md:py-28">
        {/* classroom chalkboard */}
        <div className="relative overflow-hidden rounded-[32px] border-[10px] border-[#8A5A44] bg-[#1F3A33] px-6 py-14 text-paper shadow-[inset_0_0_80px_rgba(0,0,0,0.35),0_30px_60px_-30px_rgba(15,23,43,0.6)] md:px-14 md:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 font-display text-white/10">
            {chalk.map((x) => (
              <span key={x.t} className={`absolute hidden md:block ${x.c}`}>
                {x.t}
              </span>
            ))}
          </div>

          <div className="relative text-center">
            <p className="text-sm font-medium text-sun">Less admin work</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl leading-[1.12] md:text-[2.6rem]">
              What a Monday looks like, before and after
            </h2>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-dashed border-white/25 p-7">
              <p className="font-display text-xl font-bold text-white/80">Before EduRit</p>
              <ul className="mt-5 space-y-4">
                {before.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.97rem] text-white/75">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay text-[11px] text-white">✕</span>
                    <span className="line-through decoration-white/30">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-7 text-ink">
              <p className="font-display text-xl font-bold text-brand">With EduRit</p>
              <ul className="mt-5 space-y-4">
                {after.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.97rem]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meadow text-[11px] text-white">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* chalk tray */}
          <div aria-hidden className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2 pb-2">
            <span className="h-2 w-10 rounded-full bg-white/80" />
            <span className="h-2 w-7 rounded-full bg-sun/80" />
            <span className="h-2 w-8 rounded-full bg-teal/80" />
          </div>
        </div>
      </div>
    </section>
  );
}
