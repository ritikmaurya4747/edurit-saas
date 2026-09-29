import { FAQ } from "./components/faq/FAQ";
import { Hero } from "./components/hero/Hero";
import { PricingSection } from "./components/pricing/PricingSection";
import { ProductShowcase } from "./components/product/ProductShowcase";
import { BentoFeatures } from "./components/sections/BentoFeatures";
import { DayStory } from "./components/sections/DayStory";
import { FinalCTA } from "./components/sections/FinalCTA";
import { PortalCards } from "./components/sections/PortalCards";
import { TrustStrip } from "./components/sections/TrustStrip";
import { TestimonialSection } from "./components/testimonials/TestimonialSection";


export default function Home() {
  return (
    <>
      <Hero />
      <DayStory />
      <BentoFeatures />
      <ProductShowcase />
      <PortalCards />
      <TrustStrip />
      <TestimonialSection />
      <PricingSection />
      <FAQ />
      <FinalCTA />
    </>
  );
}
