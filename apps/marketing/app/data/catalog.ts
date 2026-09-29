export type CatalogGroup = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

// Feature catalogue shown on /features, built from the capabilities listed on edurit.in.
export const catalog: CatalogGroup[] = [
  {
    id: "academics",
    title: "Academics",
    description: "Gradebooks, report cards, and results.",
    items: ["Digital gradebooks and rubrics", "GPA and report cards", "Weighted assessments", "Publish assignments", "Online assignment submissions", "Subject-level performance trends"],
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Daily registers without the paper.",
    items: ["Real-time attendance marking", "Mark a class in seconds", "Automated parent notifications", "Attendance calendar for students", "Daily analytics", "Monthly analytics"],
  },
  {
    id: "fees",
    title: "Fees",
    description: "Invoices, payments, and balances.",
    items: ["Automated invoicing", "Online payment gateway", "Pay fees from the parent app", "Automatic receipts", "Detailed financial reports", "Fee payment status for students"],
  },
  {
    id: "communication",
    title: "Communication",
    description: "Parents, staff, and students in the loop.",
    items: ["Direct teacher–parent messaging", "Message students", "School event calendar", "SMS notifications", "Email notifications", "Parent and student portals"],
  },
  {
    id: "administration",
    title: "Administration",
    description: "Admissions, timetables, and records.",
    items: ["Student profiles and academic history", "Behavior records", "Conflict-free timetables for classes, teachers, and rooms", "Staff and class management", "Four role-based portals", "Bulk CSV import and invitations"],
  },
  {
    id: "insights",
    title: "Insights",
    description: "Numbers leadership can act on.",
    items: ["AI-powered grade analytics (new)", "Board-ready reports", "At-risk student alerts", "Attendance and fee analytics", "One-click export", "Multi-school reporting (Enterprise)"],
  },
];
