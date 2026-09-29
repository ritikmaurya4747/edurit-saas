import { pageMeta } from "../lib/metadata";
import { PageHero } from "../components/ui/PageHero";
import { Container } from "../components/ui/Container";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ProductShowcase } from "../components/product/ProductShowcase";
import { FeatureSection } from "../components/sections/FeatureSection";
import { FeatureCatalog } from "../components/sections/FeatureCatalog";
import { MobileSection } from "../components/sections/MobileSection";
import { AnalyticsSection } from "../components/sections/AnalyticsSection";
import { SecuritySection } from "../components/sections/SecuritySection";
import { FinalCTA } from "../components/sections/FinalCTA";
import { featureSections } from "../data/features";

export const metadata = pageMeta({
  title: "Features",
  description:
    "Gradebooks, attendance, fees, parent communication, timetables, and analytics — every EduRit module works from one shared student record.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        kicker="Product"
        title="One student record. Every school workflow."
        description="Attendance, marks, fees, and communication all read from and write to the same student record, so nothing is typed twice."
      />
      <ProductShowcase />
      <FeatureCatalog />
      <section className="bg-paper-sunk">
        <Container className="pt-20 md:pt-28">
          <SectionHeading kicker="In depth" title="How each module works" />
        </Container>
        <Container className="pb-10">
          {featureSections.map((section, i) => (
            <FeatureSection key={section.id} data={section} index={i} />
          ))}
        </Container>
      </section>
      <MobileSection />
      <AnalyticsSection />
      <SecuritySection />
      <FinalCTA />
    </>
  );
}
