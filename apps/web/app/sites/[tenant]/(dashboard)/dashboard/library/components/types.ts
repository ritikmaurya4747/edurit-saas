// Mutations on this page refresh every library query and the home stats.
export const LIBRARY_KEYS = [["library"], ["dashboard"]];

// Mirrors the API defaults (summary also returns them).
export const FINE_PER_DAY = 2;
export const DEFAULT_LOAN_DAYS = 14;

export interface LibrarySummary {
  titles: number;
  totalCopies: number;
  availableCopies: number;
  issued: number;
  overdue: number;
  finesPending: number;
  finePerDay: number;
  maxBooksPerStudent: number;
  defaultLoanDays: number;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  category: string | null;
  shelfLocation: string | null;
  totalCopies: number;
  availableCopies: number;
  issuedCount: number;
  createdAt: string;
}

export type BorrowerType = "student" | "staff";
export type IssueStatus = "issued" | "overdue" | "returned";

export interface Borrower {
  type: BorrowerType;
  id: string;
  name: string;
  number: string;
  classLabel: string | null;
  designation: string | null;
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string | null;
  staffId: string | null;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: string;
  finePaid: boolean;
  remarks: string | null;
  book: { id: string; title: string; author: string | null; isbn: string | null; shelfLocation: string | null };
  borrower: Borrower | null;
  status: IssueStatus;
  isOverdue: boolean;
  daysOverdue: number;
  fine: number;
  finePending: boolean;
}

// Date input value N days from today (browser local date).
export const inputDaysFromToday = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

// Days between a DATE value ("YYYY-MM-DD…") and a "YYYY-MM-DD" input (positive when `day` is later).
export const daysBetween = (dueDate: string, day: string) =>
  Math.round((Date.parse(day.slice(0, 10)) - Date.parse(dueDate.slice(0, 10))) / 86_400_000);
