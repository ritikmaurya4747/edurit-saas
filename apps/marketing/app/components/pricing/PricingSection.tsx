import { pricingPlans } from "@/app/data/pricing";
import { SectionHeading } from "../ui/SectionHeading";
import { cn } from "@/app/lib/utils";
import { Button } from "../ui/Button";


export function PricingSection({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="bg-paper">
      <div className="container-content py-20 md:py-28">
        {heading && (
        <SectionHeading
          kicker="Pricing"
          title="Simple, transparent pricing"
          description="No hidden fees. Cancel anytime. Start with 30 days free on any plan."
        />
        )}

        <div className={cn("grid gap-6 md:grid-cols-3", heading && "mt-14")}>
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-3xl border p-7",
                plan.featured
                  ? "border-transparent bg-gradient-to-br from-brand to-accent text-white shadow-[0_40px_80px_-30px_rgba(79,70,229,0.75)] md:-my-4 md:py-11"
                  : "border-line bg-paper-raised"
              )}
            >
              {plan.featured && (
                <span className="mb-4 w-fit rounded-full bg-white/20 px-3 py-1 text-[0.75rem] font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl tracking-tight">{plan.name}</h3>
              <p
                className={cn(
                  "mt-4 font-display text-4xl font-bold tracking-tight",
                  plan.featured ? "text-paper" : "text-ink"
                )}
              >
                {plan.price}
                {plan.period && (
                  <span
                    className={cn(
                      "ml-1.5 text-base font-normal",
                      plan.featured ? "text-paper/60" : "text-ink-faint"
                    )}
                  >
                    {plan.period}
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "mt-3 text-[0.9rem] leading-relaxed",
                  plan.featured ? "text-paper/75" : "text-ink-soft"
                )}
              >
                {plan.description}
              </p>

              <Button
                href="/demo"
                variant={plan.featured ? "light" : "secondary"}
                className={cn(
                  "mt-6 w-full",
                                    !plan.featured && "border-ink/25"
                )}
              >
                {plan.cta}
              </Button>

              <ul
                className={cn(
                  "mt-7 space-y-3 border-t pt-6 text-[0.9rem]",
                  plan.featured ? "border-paper/15" : "border-line"
                )}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className={plan.featured ? "text-accent-soft" : "text-accent-deep"}>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[0.9rem] text-ink-faint">
          All plans include a 30-day trial. No setup fee. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
