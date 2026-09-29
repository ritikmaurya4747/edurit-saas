import { pageMeta } from "../lib/metadata";
import { PageHero } from "../components/ui/PageHero";
import { RoleBasedSolutions } from "../components/sections/RoleBasedSolutions";
import { SchoolTypes } from "../components/sections/SchoolTypes";
import { AutomationSection } from "../components/sections/AutomationSection";
import { HowItWorks } from "../components/sections/HowItWorks";
import { TestimonialSection } from "../components/testimonials/TestimonialSection";
import { FinalCTA } from "../components/sections/FinalCTA";

export const metadata = pageMeta({
  title: "Solutions",
  description:
    "How EduRit works for school leaders, teachers, parents, students, and office staff — and for primary schools, secondary schools, and school groups.",
  path: "/solutions",
});

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        kicker="Solutions"
        title="Built for everyone at your school, not just the office."
        description="A principal, a class teacher, and a parent need different things from the same school day. EduRit gives each of them a view built for their job."
      />
      <RoleBasedSolutions />
      <SchoolTypes />
      <AutomationSection />
      <HowItWorks />
      <TestimonialSection />
      <FinalCTA />
    </>
  );
}
