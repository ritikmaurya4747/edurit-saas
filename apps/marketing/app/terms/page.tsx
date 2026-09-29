import { LegalPage } from "../components/ui/LegalPage";
import { pageMeta } from "../lib/metadata";


export const metadata = pageMeta({
  title: "Terms of service",
  description: "The terms that apply to schools using EduRit.",
  path: "/terms",
});

const sections = [
  { id: "agreement", title: "Agreement", body: ["[State who the agreement is between and when it applies.]"] },
  { id: "accounts", title: "Accounts and users", body: ["[Describe school administrator responsibilities for staff, parent, and student accounts.]"] },
  { id: "plans", title: "Plans, trials, and billing", body: ["[Describe the free plan, the 30-day trial, billing periods, renewals, and cancellation.]"] },
  { id: "data", title: "School data", body: ["[State that the school owns its data, and describe export and deletion on cancellation.]"] },
  { id: "acceptable-use", title: "Acceptable use", body: ["[List prohibited uses of the service.]"] },
  { id: "availability", title: "Service availability and support", body: ["[Describe support by plan and any SLA offered on Enterprise.]"] },
  { id: "liability", title: "Liability", body: ["[Limitation of liability and indemnities, to be drafted by counsel.]"] },
  { id: "law", title: "Governing law", body: ["[Governing law and jurisdiction.]"] },
];

export default function TermsPage() {
  return <LegalPage kicker="Legal" title="Terms of service" updated="[date]" sections={sections} />;
}
