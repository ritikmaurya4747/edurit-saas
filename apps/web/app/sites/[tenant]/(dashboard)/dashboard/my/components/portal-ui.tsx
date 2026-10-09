"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { BadgeTone } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import type { AttendanceStatus, LeaveStatus, PortalChild } from "../types";

// Small building blocks shared by the student / parent portal pages.

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export const ATTENDANCE_TONE: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "yellow",
  EXCUSED: "blue",
};

export const LEAVE_TONE: Record<LeaveStatus, BadgeTone> = { PENDING: "yellow", APPROVED: "green", REJECTED: "red" };

// "13:30" → "1:30 PM"
export const formatClock = (value?: string | null) => {
  if (!value) return "—";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const h = Number(match[1]);
  return `${h % 12 || 12}:${match[2]} ${h < 12 ? "AM" : "PM"}`;
};

// Calendar-day difference between a due instant and now, in the browser's timezone.
export const dueLabel = (due: string | Date) => {
  const d = typeof due === "string" ? new Date(due) : due;
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(d) - startOf(new Date())) / 86_400_000);
  if (days < -1) return `Overdue by ${-days} days`;
  if (days === -1) return d.getTime() < Date.now() ? "Was due yesterday" : "Due yesterday";
  if (days === 0) return d.getTime() < Date.now() ? "Was due today" : "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
};

// Local (browser) date + time for timestamptz values like homework due dates.
export const formatDueDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const numberish = (value: string | number | null | undefined) => {
  if (value == null || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : String(value);
};

export function StudentAvatar({
  student,
  size = "md",
  className,
}: {
  student: { name: string; photoUrl: string | null };
  size?: "xs" | "md" | "lg";
  className?: string;
}) {
  const dims = { xs: "h-6 w-6 text-[10px]", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg sm:h-16 sm:w-16" }[size];
  if (student.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={student.photoUrl} alt="" className={cn("shrink-0 rounded-full object-cover", dims, className)} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#1C263A] font-bold text-white", dims, className)}
    >
      {getInitials(student.name)}
    </span>
  );
}

export function ChildSwitcher({
  items,
  activeId,
  onSelect,
  className,
}: {
  items: PortalChild[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (items.length < 2) return null;
  return (
    <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 print:hidden", className)} role="tablist" aria-label="Choose child">
      {items.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(child.id)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition-colors",
              active ? "border-[#1C263A] bg-[#1C263A] text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            <StudentAvatar student={child} size="xs" className={active ? "bg-white text-[#1C263A]" : undefined} />
            <span>{child.firstName || child.name}</span>
            {child.sectionLabel && <span className={cn("text-xs", active ? "text-white/70" : "text-gray-400")}>{child.sectionLabel}</span>}
          </button>
        );
      })}
    </div>
  );
}

// White card with a small title row, optionally linking to a full page.
export function SectionCard({
  title,
  href,
  hrefLabel,
  action,
  children,
  className,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-gray-200 bg-white p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {action}
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            {hrefLabel ?? "View all"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export const CardEmpty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">{children}</p>
);

// Scoped print stylesheet: only the element with `targetId` is printed.
export const PrintStyles = ({ targetId }: { targetId: string }) => (
  <style>{`
@media print {
  @page { margin: 12mm; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body * { visibility: hidden; }
  #${targetId}, #${targetId} * { visibility: visible; }
  #${targetId} { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
  .h-screen { height: auto !important; }
  main { overflow: visible !important; }
  #${targetId} .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`}</style>
);
