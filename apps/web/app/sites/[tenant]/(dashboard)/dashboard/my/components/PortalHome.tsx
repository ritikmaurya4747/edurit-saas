"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Award, BookOpen, Bus, CalendarDays, CalendarRange, CreditCard, Megaphone, UserCheck } from "lucide-react";
import { Badge, ErrorState, LoadingState, StatTile } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate, humanize } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { PORTAL_KEY, portalPath, usePortalStudent } from "../hooks";
import type { PortalChild, PortalOverview } from "../types";
import { NoStudentLinked } from "./PortalPage";
import { CardEmpty, ChildSwitcher, DAY_NAMES, dueLabel, formatClock, SectionCard, StudentAvatar } from "./portal-ui";

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

const QUICK_LINKS = [
  { href: "/dashboard/my/attendance", label: "Attendance", icon: UserCheck },
  { href: "/dashboard/my/homework", label: "Homework", icon: BookOpen },
  { href: "/dashboard/my/results", label: "Results", icon: Award },
  { href: "/dashboard/my/fees", label: "Fees", icon: CreditCard },
  { href: "/dashboard/my/timetable", label: "Timetable", icon: CalendarRange },
  { href: "/dashboard/my/services", label: "Library & Transport", icon: Bus },
];

const PRIORITY_TONE: Record<string, "red" | "purple" | "gray"> = { ALERT: "red", EVENT: "purple" };

const TileLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="block rounded-xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C263A]/30">
    {children}
  </Link>
);

export default function PortalHome() {
  const user = useUser();
  const { me, children, student, select } = usePortalStudent();

  if (me.isLoading) return <LoadingState />;
  if (me.error || !me.data) {
    return <ErrorState message={me.error?.message ?? "Could not load your profile."} onRetry={() => me.refetch()} />;
  }

  const firstName = (me.data.name || user?.firstName || user?.name || "").split(" ")[0] ?? "";
  const isParent = me.data.type === "PARENT";

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-semibold leading-tight text-[#0d1626] sm:text-2xl">
          {greetingFor(user?.timezone)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-xs text-[#65758b]">
          {student
            ? isParent && !student.isSelf
              ? `Here's how ${student.firstName || student.name} is doing at ${user?.tenantName || "school"}.`
              : `Here's your day at ${user?.tenantName || "school"}.`
            : `Welcome to ${user?.tenantName || "your school"}.`}
          {me.data.academicYear && <span className="ml-1 text-[#8b96a5]">Session {me.data.academicYear.name}.</span>}
        </p>
      </header>

      <ChildSwitcher items={children} activeId={student?.id ?? null} onSelect={select} className="mb-4" />

      {student ? <Overview student={student} /> : <NoStudentLinked />}
    </div>
  );
}

function Overview({ student }: { student: PortalChild }) {
  const overview = useApiQuery<PortalOverview>([PORTAL_KEY, "overview", student.id], portalPath(student.id, "overview"));

  if (overview.isLoading) return <LoadingState label="Loading overview…" />;
  if (overview.error || !overview.data) {
    return <ErrorState message={overview.error?.message ?? "Could not load the overview."} onRetry={() => overview.refetch()} />;
  }

  const data = overview.data;
  const s = data.student;
  const att = data.attendance;
  const fees = data.fees;
  const hw = data.homework;
  const result = data.latestResult;

  return (
    <div className="space-y-4">
      {/* Student card */}
      <section className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <StudentAvatar student={s} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg font-bold text-gray-900 sm:text-xl">{s.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>
              <span className="text-gray-400">Class </span>
              <span className="font-semibold">{s.sectionLabel ?? "Not enrolled this year"}</span>
            </span>
            {s.rollNumber != null && (
              <span>
                <span className="text-gray-400">Roll </span>
                <span className="font-semibold">{s.rollNumber}</span>
              </span>
            )}
            <span>
              <span className="text-gray-400">Adm. no </span>
              <span className="font-semibold">{s.admissionNumber}</span>
            </span>
          </div>
        </div>
        <div className="hidden text-right text-xs text-gray-500 sm:block">
          <p className="font-semibold text-gray-700">{DAY_NAMES[data.dayOfWeek]}</p>
          <p>{formatDate(data.today)}</p>
        </div>
      </section>

      {/* Tiles */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TileLink href="/dashboard/my/attendance">
          <StatTile
            label="Attendance (this year)"
            value={att.percent != null ? `${att.percent}%` : "—"}
            hint={
              att.total > 0
                ? `This month: ${att.thisMonth.percent != null ? `${att.thisMonth.percent}%` : "—"} · ${att.absent} absent`
                : "Not marked yet"
            }
            tone={att.percent == null ? "default" : att.percent < 75 ? "danger" : att.percent < 85 ? "warning" : "success"}
          />
        </TileLink>
        <TileLink href="/dashboard/my/fees">
          <StatTile
            label="Fees due"
            value={formatCurrency(fees.totalDue, fees.currency)}
            hint={
              fees.overdueAmount > 0 ? (
                <span className="font-semibold text-red-600">{formatCurrency(fees.overdueAmount, fees.currency)} overdue</span>
              ) : fees.nextDueDate ? (
                `Next due ${formatDate(fees.nextDueDate)}`
              ) : (
                "All fees paid"
              )
            }
            tone={fees.overdueAmount > 0 ? "danger" : fees.totalDue === 0 ? "success" : "default"}
          />
        </TileLink>
        <TileLink href="/dashboard/my/homework">
          <StatTile
            label="Pending homework"
            value={hw.pendingCount}
            hint={hw.overdueCount > 0 ? `${hw.overdueCount} overdue` : hw.pendingCount ? "Nothing overdue" : "All caught up"}
            tone={hw.overdueCount > 0 ? "warning" : "default"}
          />
        </TileLink>
        <TileLink href="/dashboard/my/results">
          <StatTile
            label="Latest result"
            value={result?.grade ?? "—"}
            hint={
              result
                ? [result.examName, result.percent != null ? `${result.percent}%` : null, result.rank ? `Rank ${result.rank}/${result.classSize}` : null]
                    .filter(Boolean)
                    .join(" · ")
                : "No results published yet"
            }
            tone={result?.result === "FAIL" ? "danger" : "default"}
          />
        </TileLink>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={`Today's timetable · ${DAY_NAMES[data.dayOfWeek]}`} href="/dashboard/my/timetable" hrefLabel="Week">
          {data.todayTimetable.length === 0 ? (
            <CardEmpty>No classes scheduled for today.</CardEmpty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.todayTimetable.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                    {t.periodNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{t.subject.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {t.teacherName || "—"}
                      {t.roomNumber ? ` · Room ${t.roomNumber}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-gray-600">
                    {formatClock(t.startTime)} – {formatClock(t.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Homework due soon" href="/dashboard/my/homework">
          {hw.dueSoon.length === 0 ? (
            <CardEmpty>{hw.pendingCount ? "No upcoming deadlines — check overdue work." : "No homework due. All caught up!"}</CardEmpty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {hw.dueSoon.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{h.title}</p>
                    <p className="text-xs text-gray-500">{h.subject}</p>
                  </div>
                  <Badge tone="yellow">{dueLabel(h.dueDate)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Notices" href="/dashboard/notice">
          {data.notices.length === 0 ? (
            <CardEmpty>No notices right now.</CardEmpty>
          ) : (
            <ul className="space-y-3">
              {data.notices.map((n) => (
                <li key={n.id} className="flex gap-3">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      {n.priority !== "INFO" && <Badge tone={PRIORITY_TONE[n.priority] ?? "gray"}>{humanize(n.priority)}</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{n.excerpt}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(n.publishedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Upcoming events" href="/dashboard/calendar" hrefLabel="Calendar">
          {data.upcomingEvents.length === 0 ? (
            <CardEmpty>No upcoming events or exams.</CardEmpty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.upcomingEvents.map((e) => (
                <li key={`${e.kind}-${e.id}`} className="flex items-center gap-3 py-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(e.startDate)}
                      {e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ""}
                    </p>
                  </div>
                  <Badge tone={e.kind === "EXAM" ? "purple" : e.isHoliday ? "green" : "blue"}>
                    {e.kind === "EXAM" ? "Exam" : e.isHoliday ? "Holiday" : humanize(e.type)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Icon className="h-5 w-5 text-[#1C263A]" />
            {label}
          </Link>
        ))}
      </section>
    </div>
  );
}
