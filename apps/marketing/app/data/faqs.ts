export type FAQ = { question: string; answer: string };

export const faqs: FAQ[] = [
  {
    question: "How long does it take to set up EduRit?",
    answer:
      "Most schools are up and running in under an hour. Entering your school details, creating classes, and defining your academic calendar takes under 30 minutes; then you invite teachers, enroll students, and link parents by CSV or email.",
  },
  {
    question: "Can we bring over data from our existing system?",
    answer:
      "Yes. Student records, class structures, and historical attendance or fee data can be imported from a spreadsheet or export file from most existing systems. Our onboarding team reviews your data before import to catch formatting issues early.",
  },
  {
    question: "Can different roles have different levels of access?",
    answer:
      "Yes. EduRit has four distinct portals — Super Admin, Teacher, Student, and Parent — each showing only what that person needs, with no clutter.",
  },
  {
    question: "Is training included when we sign up?",
    answer:
      "Yes. Every plan includes a guided setup session and onboarding materials for staff. Standard and Enterprise plans include live training sessions for teaching and administrative staff.",
  },
  {
    question: "Can parents actually use this, or is it mainly for staff?",
    answer:
      "Parents get their own login to view attendance, grades, homework, and fee status for each of their children, and can message teachers directly. It's built to be used from a phone as much as a desktop.",
  },
  {
    question: "Does EduRit work well on mobile devices?",
    answer:
      "Yes. Attendance marking, gradebooks, messaging, and the parent and student experience are all designed mobile-first, since most day-to-day use happens from a phone between classes or at home.",
  },
  {
    question: "What does support look like after we go live?",
    answer:
      "Support is available 24/7. Starter includes email support, Standard adds priority support, and Enterprise customers get a dedicated success manager and an SLA guarantee.",
  },
  {
    question: "Can EduRit handle more than one school under the same trust or group?",
    answer:
      "Yes, on the Enterprise plan: multi-school management, unlimited students, custom integrations, SSO & SAML, and an on-premise option for large institutions and school networks.",
  },
];
