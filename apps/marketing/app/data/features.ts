export type CoreFeature = {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  stat: { value: string; label: string };
};

export const coreFeatures: CoreFeature[] = [
  {
    id: "academics",
    label: "Academics",
    title: "Every gradebook, in one register",
    description:
      "Teachers record marks once. Report cards, GPA calculations, and subject-level trends update immediately for students and parents, with no re-entry and no spreadsheets to reconcile.",
    bullets: [
      "Configurable grading scales per board or curriculum",
      "Auto-generated report cards and transcripts",
      "Subject and class performance trends over each term",
    ],
    stat: { value: "1 entry", label: "updates gradebook, report card, and parent view together" },
  },
  {
    id: "attendance",
    label: "Attendance",
    title: "Attendance without the paperwork",
    description:
      "Mark a class present in seconds from any device. Parents are notified the moment a child is marked absent, and admins see school-wide patterns without chasing paper registers.",
    bullets: [
      "Roll-call marking built for under a minute per class",
      "Automatic parent alerts for absence and late arrival",
      "Daily, monthly, and term-wide attendance analytics",
    ],
    stat: { value: "Under 60s", label: "to mark a full class register" },
  },
  {
    id: "fees",
    label: "Fees",
    title: "Fee collection that reconciles itself",
    description:
      "Generate invoices by class, term, or fee head. Parents pay online or record cash and cheque payments at the counter, with every receipt and outstanding balance tracked in one ledger.",
    bullets: [
      "Bulk invoice generation by class or fee category",
      "Online payments with automatic receipt generation",
      "Live outstanding-balance and collection reports",
    ],
    stat: { value: "60%", label: "reduction in overdue accounts with automated invoicing" },
  },
  {
    id: "communication",
    label: "Communication",
    title: "Keep every parent in the loop",
    description:
      "Circulars, homework, and one-to-one messages reach parents through the channel they already check, with delivery and read status visible to staff.",
    bullets: [
      "School-wide and class-wide circulars in one send",
      "Direct messaging between teachers and parents",
      "Delivery and read receipts on every notice",
    ],
    stat: { value: "One send", label: "reaches an entire class or the whole school" },
  },
  {
    id: "administration",
    label: "Administration",
    title: "Timetables and admissions, handled",
    description:
      "Build conflict-free timetables across classes, teachers, and rooms in minutes, and move new admissions from enquiry to enrolled student without re-typing a single form.",
    bullets: [
      "Conflict-free timetable generation for the whole school",
      "Admissions pipeline from enquiry to enrolment",
      "Role-based access for every staff position",
    ],
    stat: { value: "Minutes", label: "to generate a school-wide timetable" },
  },
];

export type FeatureSectionData = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  align: "left" | "right";
};

export const featureSections: FeatureSectionData[] = [
  {
    id: "smarter-academics",
    eyebrow: "Academics",
    title: "Smarter academics, less duplicate work",
    description:
      "A teacher marks an assessment once. That single entry becomes the gradebook, the term report, and the performance trend a principal reviews at the end of the month — no exporting, no retyping.",
    bullets: [
      "Custom grading scales for any board or curriculum",
      "Report cards generated on demand, not at term-end scramble",
      "Early flags for students trending below their usual average",
    ],
    align: "left",
  },
  {
    id: "attendance-paperwork",
    eyebrow: "Attendance",
    title: "Attendance without the paperwork",
    description:
      "Replace the paper register with a roll-call that takes under a minute per class. Absences reach parents automatically, and the school gets a clear read on patterns before they become a problem.",
    bullets: [
      "Mark a class present from a phone, tablet, or desktop",
      "Instant parent alerts for absence and late arrival",
      "Attendance trends by class, section, or student",
    ],
    align: "right",
  },
  {
    id: "parents-connected",
    eyebrow: "Communication",
    title: "Keep parents connected, not chasing calls",
    description:
      "Parents see grades, attendance, fee status, and school circulars the moment they update — no phone tag with the front office, no missed notices sent home in a bag.",
    bullets: [
      "A single parent login for every child at the school",
      "Direct messages with class teachers and staff",
      "Read receipts so staff know a notice landed",
    ],
    align: "left",
  },
  {
    id: "simplify-fees",
    eyebrow: "Fees",
    title: "Simplify fee management, end to end",
    description:
      "From invoice generation to online payment to reconciliation, fee management runs as one workflow instead of three separate registers that need to be matched by hand each month.",
    bullets: [
      "Term and class-wise invoice generation in bulk",
      "Online payment plus manual entry for cash and cheque",
      "One outstanding-balance report, always current",
    ],
    align: "right",
  },
  {
    id: "data-decisions",
    eyebrow: "Insights",
    title: "Turn school data into decisions",
    description:
      "See attendance, academic, and financial trends the way a principal actually needs them — by class, by term, by student — instead of pulling three separate exports and stitching them together.",
    bullets: [
      "School-wide dashboards for leadership and management",
      "Class and subject-level performance comparisons",
      "Exportable reports for board meetings and audits",
    ],
    align: "left",
  },
];
