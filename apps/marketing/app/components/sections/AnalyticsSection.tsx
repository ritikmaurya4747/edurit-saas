import { AnalyticsMock } from "../product/mockups";
import { SectionHeading } from "../ui/SectionHeading";


export function AnalyticsSection() {
  return (
    <section className="bg-paper-sunk">
      <div className="container-content py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 [&>*]:min-w-0">
          <div>
            <SectionHeading
              kicker="Insights"
              title="See your whole school on one screen"
              description="Attendance, fee collection, and results by class, by term, or school-wide — ready for the next management meeting without stitching three exports together."
            />
            <ul className="mt-8 space-y-3 text-[0.97rem]">
              {["Trends across terms and classes", "Early flags for students who need support", "Export-ready reports for boards and audits"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meadow-soft text-[11px] font-bold text-meadow">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <span aria-hidden className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-teal/70" />
            <span aria-hidden className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-accent/80" />
            <div className="relative">
              <AnalyticsMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
