// The four portals from edurit.in, with their original feature lists.
export type Role = {
  id: string;
  name: string;
  headline: string;
  description: string;
  bullets: string[];
  cta: string;
};

export const roles: Role[] = [
  {
    id: "admin",
    name: "Super Admin",
    headline: "Run the entire school from one portal",
    description:
      "Full oversight of finances, staff, classes, and settings — with school-wide reports ready whenever management asks for them.",
    bullets: ["Manage entire school", "Full financial oversight", "Staff & class management", "System configuration", "School-wide reports"],
    cta: "Try Super Admin Portal",
  },
  {
    id: "teacher",
    name: "Teacher",
    headline: "Less admin work, more time in front of the class",
    description:
      "Attendance, gradebooks, assignments, and parent messages in the one place a teacher already opens every day.",
    bullets: ["Mark attendance in seconds", "Digital gradebook", "Publish assignments", "Message parents & students", "Personal schedule view"],
    cta: "Try Teacher Portal",
  },
  {
    id: "student",
    name: "Student",
    headline: "Grades, timetable, and assignments in one place",
    description:
      "Students see their own results the moment a teacher publishes them, and submit assignments without paper or email.",
    bullets: ["View all grades & GPA", "Class timetable", "Assignment submissions", "Attendance calendar", "Fee payment status"],
    cta: "Try Student Portal",
  },
  {
    id: "parent",
    name: "Parent",
    headline: "Stay involved, without calling the school",
    description:
      "A child's progress, attendance, and fees on one screen — with a direct line to the teacher when something needs a conversation.",
    bullets: ["Child's live progress", "Attendance alerts", "Pay fees online", "Direct teacher messaging", "School event calendar"],
    cta: "Try Parent Portal",
  },
];
