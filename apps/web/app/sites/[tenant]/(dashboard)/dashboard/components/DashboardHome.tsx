"use client";

import { ErrorState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { DashboardOverview } from "../data/dashboard.types";
import AttendanceTrend from "./AttendanceTrend";
import DashboardHeader from "./DashboardHeader";
import { BirthdaysToday, RecentPayments, UpcomingExams } from "./DashboardLists";
import DashboardSkeleton from "./DashboardSkeleton";
import NoticesAttention from "./NoticesAttention";
import SetupChecklist, { buildSetupSteps } from "./SetupChecklist";
import StatCard from "./StatCard";

const greetingFor = (timeZone?: string) => {
  let hour = new Date().getHours();
  try {
    hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()));
  } catch {
    // invalid timezone → browser time
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

type Stat = React.ComponentProps<typeof StatCard>;

const buildStats = (data: DashboardOverview): Stat[] => {
  const att = data.attendanceToday;
  const monthPercent = data.attendanceTrend[data.attendanceTrend.length - 1]?.percent ?? null;
  const attDiff = att.percent != null && monthPercent != null ? Math.round((att.percent - monthPercent) * 10) / 10 : null;

  const attendance: Stat = {
    title: "Attendance today",
    value: att.percent != null ? `${att.percent}%` : "—",
    description:
      att.marked > 0
        ? `${formatNumber(att.present)} of ${formatNumber(att.marked)} present · ${att.sectionsMarked}/${att.sectionsTotal} sections`
        : `Not marked yet · 0/${att.sectionsTotal} sections`,
    ...(attDiff != null && attDiff !== 0 && { trend: `${Math.abs(attDiff)}pt`, trendType: attDiff > 0 ? ("up" as const) : ("down" as const) }),
    danger: att.percent != null && att.percent < 75,
  };

  const second: Stat = data.fees
    ? {
        title: data.academicYear ? `Fee collection, ${data.academicYear.name}` : "Fee collection",
        value: data.fees.collectionRate != null ? `${data.fees.collectionRate}%` : "—",
        description:
          data.fees.overdueCount > 0
            ? `${plural(data.fees.overdueCount, "overdue invoice")} · ${formatCurrency(data.fees.overdueAmount, data.fees.currency)}`
            : data.fees.invoiced > 0
              ? `${formatCurrency(data.fees.collected, data.fees.currency)} of ${formatCurrency(data.fees.invoiced, data.fees.currency)}`
              : "No invoices issued yet",
        danger: data.fees.overdueCount > 0,
      }
    : {
        title: "Active staff",
        value: formatNumber(data.staff.active),
        description: data.staff.onLeaveToday > 0 ? `${formatNumber(data.staff.onLeaveToday)} on leave today` : "No one on leave today",
        warning: data.staff.onLeaveToday > 0,
      };

  const students: Stat = {
    title: "Active students",
    value: formatNumber(data.students.active),
    description:
      data.students.newThisMonth > 0 ? `+${formatNumber(data.students.newThisMonth)} admitted this month` : "No new admissions this month",
    ...(data.students.newThisMonth > 0 && { trend: `+${formatNumber(data.students.newThisMonth)}`, trendType: "up" as const }),
  };

  const p = data.pendingApprovals;
  const parts = [
    p.studentLeaves && plural(p.studentLeaves, "student leave"),
    p.staffLeaves && plural(p.staffLeaves, "staff leave"),
    p.admissions && plural(p.admissions, "admission"),
  ].filter(Boolean);
  const approvals: Stat = {
    title: "Pending approvals",
    value: formatNumber(p.total),
    description: parts.length ? parts.join(" · ") : "You're all caught up",
    warning: p.total > 0,
  };

  return [attendance, second, students, approvals];
};

const DashboardHome = () => {
  const user = useUser();
  const can = useCan();
  const overview = useApiQuery<DashboardOverview>(["dashboard", "overview"], "dashboard/overview");

  if (overview.isLoading) return <DashboardSkeleton />;
  if (overview.error || !overview.data) {
    return (
      <ErrorState
        message={overview.error?.message ?? "Could not load the dashboard."}
        onRetry={() => overview.refetch()}
      />
    );
  }

  const data = overview.data;
  const canSetup = can(PERMISSIONS.ACADEMIC_YEAR_MANAGE) || can(PERMISSIONS.CLASS_MANAGE);
  const steps = buildSetupSteps(data.setup);
  const setupIncomplete = steps.some((s) => !s.done);
  const stats = buildStats(data);
  const firstName = (data.greetingName || user?.firstName || user?.name || "").split(" ")[0] ?? "";

  return (
    <div>
      <DashboardHeader
        greeting={greetingFor(user?.timezone)}
        firstName={firstName}
        schoolName={data.schoolName || user?.tenantName || ""}
        subtitle={data.academicYear ? `Session ${data.academicYear.name}.` : undefined}
        showSetupWizard={canSetup}
      />

      {canSetup && setupIncomplete && <SetupChecklist steps={steps} />}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.65fr_0.95fr]">
        <AttendanceTrend data={data.attendanceTrend} />
        <NoticesAttention notices={data.recentNotices} />
      </section>

      <section className={`mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 ${data.recentPayments ? "xl:grid-cols-3" : ""}`}>
        <UpcomingExams exams={data.upcomingExams} today={data.today} />
        {data.recentPayments && (
          <RecentPayments payments={data.recentPayments} currency={data.fees?.currency ?? user?.currency ?? "INR"} />
        )}
        <BirthdaysToday students={data.birthdaysToday} />
      </section>
    </div>
  );
};

export default DashboardHome;
