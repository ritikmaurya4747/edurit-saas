export type GuideCategory = {
  id: string;
  title: string;
  description: string;
  guides: { title: string; minutes: number }[];
};

// Help-centre topics. Titles describe guides the team should publish; link each one
// to its article once the help centre is live.
export const guideCategories: GuideCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Your first day on EduRit.",
    guides: [
      { title: "Create your school profile and academic year", minutes: 5 },
      { title: "Add classes, sections, and subjects", minutes: 6 },
      { title: "Import students from a spreadsheet", minutes: 8 },
    ],
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Registers, alerts, and reports.",
    guides: [
      { title: "Mark attendance from a phone", minutes: 3 },
      { title: "Set up absence alerts for parents", minutes: 4 },
      { title: "Read monthly attendance reports", minutes: 5 },
    ],
  },
  {
    id: "academics",
    title: "Academics",
    description: "Grading, assessments, and report cards.",
    guides: [
      { title: "Configure a grading scale", minutes: 6 },
      { title: "Create weighted assessments", minutes: 7 },
      { title: "Generate and share report cards", minutes: 5 },
    ],
  },
  {
    id: "fees",
    title: "Fees",
    description: "Invoices, payments, and receipts.",
    guides: [
      { title: "Set up fee heads for each class", minutes: 8 },
      { title: "Send invoices to a whole class", minutes: 4 },
      { title: "Record cash and cheque payments", minutes: 3 },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    description: "Circulars and parent messaging.",
    guides: [
      { title: "Send a circular to parents", minutes: 3 },
      { title: "Invite parents to the parent app", minutes: 5 },
      { title: "Check who has read a notice", minutes: 2 },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    description: "Roles, timetables, and admissions.",
    guides: [
      { title: "Give staff the right permissions", minutes: 6 },
      { title: "Build your first timetable", minutes: 10 },
      { title: "Move an enquiry to admission", minutes: 4 },
    ],
  },
];
