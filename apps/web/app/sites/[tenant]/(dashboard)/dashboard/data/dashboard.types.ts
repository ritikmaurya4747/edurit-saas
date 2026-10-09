// Response of GET /v1/dashboard/overview.

export interface AttendanceTrendPoint {
  month: string; // YYYY-MM
  label: string; // "May"
  percent: number | null;
}

export interface DashboardNotice {
  id: string;
  title: string;
  priority: string;
  targetRole: string;
  publishedAt: string;
}

export interface DashboardExam {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
}

export interface DashboardPayment {
  id: string;
  receiptNumber: string | null;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  studentName: string | null;
}

export interface DashboardFees {
  currency: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  collectionRate: number | null;
  overdueCount: number;
  overdueAmount: number;
  todayCollection: number;
  todayRefunds?: number;
}

export interface DashboardOverview {
  greetingName: string;
  schoolName: string;
  today: string;
  academicYear: { id: string; name: string } | null;
  setup: {
    hasAcademicYear: boolean;
    classes: number;
    sections: number;
    subjects: number;
    staff: number;
    students: number;
  };
  students: { active: number; newThisMonth: number };
  staff: { active: number; onLeaveToday: number };
  attendanceToday: {
    percent: number | null;
    present: number;
    absent: number;
    marked: number;
    totalStudents: number;
    sectionsMarked: number;
    sectionsTotal: number;
  };
  fees: DashboardFees | null;
  pendingApprovals: { studentLeaves: number; staffLeaves: number; admissions: number; total: number };
  attendanceTrend: AttendanceTrendPoint[];
  recentNotices: DashboardNotice[];
  upcomingExams: DashboardExam[];
  recentPayments: DashboardPayment[] | null;
  birthdaysToday: { id: string; name: string; sectionLabel: string | null }[];
}
