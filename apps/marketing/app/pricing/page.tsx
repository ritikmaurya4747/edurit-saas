import { pageMeta } from "../lib/metadata";
import { PageHero } from "../components/ui/PageHero";
import { PricingSection } from "../components/pricing/PricingSection";
import { PlanComparison } from "../components/pricing/PlanComparison";
import { FAQ } from "../components/faq/FAQ";
import { FinalCTA } from "../components/sections/FinalCTA";

export const metadata = pageMeta({
  title: "Pricing",
  description:
    "Start free with Starter, move to Standard at $49 a month as your school grows, or talk to us about Enterprise for school groups.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        kicker="Pricing"
        title="Straightforward pricing, no hidden fees."
        description="Every plan includes a 30-day trial. Upgrade, downgrade, or cancel whenever your school's needs change."
        cta={false}
      />
      <PricingSection heading={false} />
      <PlanComparison />
      <FAQ />
      <FinalCTA />
    </>
  );
}
