import { pageMeta } from "../lib/metadata";
import { LegalPage } from "../components/ui/LegalPage";

export const metadata = pageMeta({
  title: "Privacy policy",
  description: "How EduRit collects, uses, and protects information about schools, staff, parents, and students.",
  path: "/privacy",
});

const sections = [
  { id: "scope", title: "Who this policy covers", body: ["[Describe the schools, staff, parents, and students whose information EduRit processes, and whether EduRit acts on behalf of the school.]"] },
  { id: "collect", title: "Information we collect", body: ["[List the categories of data: school profile, staff accounts, student records, attendance, marks, fee and payment records, messages, and technical usage data.]"] },
  { id: "use", title: "How we use information", body: ["[Explain each purpose — providing the service, support, security, billing — and the basis for it.]"] },
  { id: "children", title: "Children's information", body: ["[Explain how student data is handled, who can see it, and how parents and schools can request access or deletion.]"] },
  { id: "sharing", title: "Sharing and processors", body: ["[Name categories of service providers such as hosting, payments, and messaging, and state that data is not sold.]"] },
  { id: "security", title: "Security and retention", body: ["[Describe verified security measures and how long each category of data is kept.]"] },
  { id: "rights", title: "Your rights", body: ["[Describe rights available under applicable law, including India's Digital Personal Data Protection Act, and how to exercise them.]"] },
  { id: "contact", title: "Contact", body: ["[Provide the contact or grievance officer details required by law.]"] },
];

export default function PrivacyPage() {
  return <LegalPage kicker="Legal" title="Privacy policy" updated="[date]" sections={sections} />;
}
