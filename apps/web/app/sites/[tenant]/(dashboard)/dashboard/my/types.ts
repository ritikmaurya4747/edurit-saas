// Response shapes of the /v1/portal/* endpoints (apps/api/src/modules/portal).

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Decimal = string | number;

export interface PortalStudentSummary {
  id: string;
  name: string;
  firstName: string;
  admissionNumber: string;
  photoUrl: string | null;
  status: string;
  sectionId: string | null;
  sectionLabel: string | null;
  rollNumber: number | null;
}

export interface PortalChild extends PortalStudentSummary {
  isSelf: boolean;
  canApplyLeave: boolean;
}

export interface PortalMe {
  type: "STUDENT" | "PARENT";
  name: string;
  academicYear: { id: string; name: string } | null;
  children: PortalChild[];
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percent: number | null;
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  subject: { name: string; code: string };
  teacherName: string;
}

export interface UpcomingEvent {
  id: string;
  kind: "EVENT" | "EXAM";
  type: string;
  title: string;
  startDate: string;
  endDate: string;
  isHoliday: boolean;
}

export interface PortalOverview {
  today: string;
  dayOfWeek: number;
  currency: string;
  academicYear: { id: string; name: string } | null;
  student: PortalStudentSummary;
  canApplyLeave: boolean;
  attendance: AttendanceSummary & { thisMonth: AttendanceSummary };
  fees: { currency: string; totalDue: number; overdueAmount: number; overdueCount: number; nextDueDate: string | null };
  homework: {
    pendingCount: number;
    overdueCount: number;
    dueSoon: { id: string; title: string; subject: string; dueDate: string }[];
  };
  latestResult: {
    examId: string;
    examName: string;
    percent: number | null;
    grade: string | null;
    result: "PASS" | "FAIL" | null;
    rank: number | null;
    classSize: number;
  } | null;
  todayTimetable: TimetableEntry[];
  notices: { id: string; title: string; excerpt: string; priority: string; publishedAt: string }[];
  upcomingEvents: UpcomingEvent[];
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  actionReason: string | null;
  createdAt: string;
}

export interface AttendanceDay {
  date: string;
  dayOfWeek: number;
  status: AttendanceStatus | null;
  remarks: string | null;
  holiday: string | null;
  leaveStatus: LeaveStatus | null;
  isFuture: boolean;
}

export interface PortalAttendance {
  month: string;
  from: string;
  to: string;
  today: string;
  student: PortalStudentSummary;
  canApplyLeave: boolean;
  summary: AttendanceSummary;
  days: AttendanceDay[];
  leaves: LeaveRequest[];
}

export type HomeworkFilter = "pending" | "submitted" | "all";

export interface PortalHomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: { id: string; name: string; code: string };
  teacherName: string;
  dueDate: string;
  maxMarks: Decimal | null;
  assignedAt: string;
  attachmentCount: number;
  isOverdue: boolean;
  status: "PENDING" | "OVERDUE" | "SUBMITTED" | "GRADED";
  submission: {
    submittedAt: string;
    isLate: boolean;
    marks: Decimal | null;
    feedback: string | null;
    gradedAt: string | null;
  } | null;
}

export interface PortalHomework {
  student: PortalStudentSummary;
  counts: { all: number; pending: number; submitted: number; overdue: number };
  items: PortalHomeworkItem[];
}

export interface PortalExamResult {
  exam: { id: string; name: string; startDate: string; endDate: string; academicYear: string };
  sectionLabel: string;
  rollNumber: number | null;
  hasMarks: boolean;
  subjects: {
    examSubjectId: string;
    name: string;
    code: string;
    examDate: string;
    maxMarks: number;
    passingMarks: number;
    marksObtained: number | null;
    percent: number | null;
    grade: string | null;
    passed: boolean | null;
    remarks: string | null;
  }[];
  total: number;
  maxTotal: number;
  percent: number | null;
  grade: string | null;
  result: "PASS" | "FAIL" | null;
  rank: number | null;
  classSize: number;
  classAverage: number | null;
  remarks: string | null;
}

export interface PortalResults {
  student: PortalStudentSummary;
  exams: PortalExamResult[];
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  academicYear: string;
  currency: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  totalAmount: Decimal;
  paidAmount: Decimal;
  balanceAmount: Decimal;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  items: { id: string; title: string; unitAmount: Decimal; quantity: number; discountAmount: Decimal; totalAmount: Decimal }[];
}

export interface PortalPayment {
  id: string;
  receiptNumber: string | null;
  amount: Decimal;
  method: string;
  paidAt: string;
  refunded: number;
  invoices: { id: string; invoiceNumber: string; amount: Decimal }[];
}

export interface PortalFees {
  student: PortalStudentSummary;
  today: string;
  currency: string;
  totals: { billed: number; paid: number; due: number; overdue: number; overdueCount: number; nextDueDate: string | null };
  invoices: PortalInvoice[];
  payments: PortalPayment[];
}

export interface PortalTimetable {
  student: PortalStudentSummary;
  academicYear: { id: string; name: string } | null;
  today: string;
  dayOfWeek: number;
  entries: TimetableEntry[];
}

export interface PortalBookIssue {
  id: string;
  book: { id: string; title: string; author: string | null; isbn: string | null };
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  isOverdue: boolean;
  overdueDays: number;
  fineAmount: Decimal;
  finePaid: boolean;
}

export interface PortalServices {
  student: PortalStudentSummary;
  today: string;
  currency: string;
  library: { current: PortalBookIssue[]; history: PortalBookIssue[]; overdueCount: number; unpaidFines: number };
  transport: {
    id: string;
    startDate: string;
    endDate: string | null;
    route: { id: string; name: string; code: string };
    stop: { id: string; name: string; pickupTime: string | null; dropTime: string | null } | null;
    vehicle: {
      registrationNumber: string;
      model: string | null;
      driverName: string;
      driverPhone: string;
      helperName: string | null;
      helperPhone: string | null;
    } | null;
  } | null;
}
