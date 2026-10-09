"use client";

import { useState } from "react";
import { CalendarClock, MessageSquareText, Paperclip, UserRound } from "lucide-react";
import { Badge, EmptyState, ErrorState, LoadingState, Tabs, type BadgeTone } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatDateTime } from "@/lib/utils/format";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { HomeworkFilter, PortalChild, PortalHomework, PortalHomeworkItem } from "../../types";
import PortalPage from "../../components/PortalPage";
import { dueLabel, formatDueDate, numberish } from "../../components/portal-ui";

const STATUS: Record<PortalHomeworkItem["status"], { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "yellow" },
  OVERDUE: { label: "Overdue", tone: "red" },
  SUBMITTED: { label: "Submitted", tone: "blue" },
  GRADED: { label: "Graded", tone: "green" },
};

const EMPTY: Record<HomeworkFilter, { title: string; description: string }> = {
  pending: { title: "Nothing pending — all caught up!", description: "New homework from teachers will appear here." },
  submitted: { title: "No submitted homework yet", description: "Homework marked as submitted by teachers shows up here." },
  all: { title: "No homework assigned yet", description: "Homework given to the class this session will appear here." },
};

export default function MyHomeworkPage() {
  return <PortalPage title="Homework">{(student) => <HomeworkBody key={student.id} student={student} />}</PortalPage>;
}

function HomeworkBody({ student }: { student: PortalChild }) {
  const [tab, setTab] = useState<HomeworkFilter>("pending");
  const query = useApiQuery<PortalHomework>(
    [PORTAL_KEY, "homework", student.id],
    portalPath(student.id, "homework"),
    { status: tab },
    { placeholderData: (prev) => prev },
  );
  const counts = query.data?.counts;

  return (
    <div>
      <Tabs<HomeworkFilter>
        tabs={[
          { id: "pending", label: "Pending", count: counts?.pending },
          { id: "submitted", label: "Submitted", count: counts?.submitted },
          { id: "all", label: "All", count: counts?.all },
        ]}
        active={tab}
        onChange={setTab}
      />

      {query.isLoading ? (
        <LoadingState label="Loading homework…" />
      ) : query.error || !query.data ? (
        <ErrorState message={query.error?.message ?? "Could not load homework."} onRetry={() => query.refetch()} />
      ) : !student.sectionId ? (
        <EmptyState title="Not enrolled in a class this session" description="Homework appears once the school enrolls the student in a class." />
      ) : query.data.items.length === 0 ? (
        <EmptyState title={EMPTY[tab].title} description={EMPTY[tab].description} />
      ) : (
        <div className={`grid grid-cols-1 gap-3 lg:grid-cols-2 ${query.isFetching ? "opacity-70" : ""}`}>
          {query.data.items.map((h) => (
            <HomeworkCard key={h.id} item={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeworkCard({ item }: { item: PortalHomeworkItem }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS[item.status];
  const sub = item.submission;
  const long = item.description.length > 180;

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#1C263A]/70">{item.subject.name}</p>
          <h3 className="mt-0.5 text-base font-bold text-gray-900">{item.title}</h3>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {item.description && (
        <div className="mt-2 text-sm text-gray-700">
          <p className={`whitespace-pre-line ${expanded ? "" : "line-clamp-3"}`}>{item.description}</p>
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 cursor-pointer text-xs font-semibold text-[#1C263A] hover:underline">
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
          {formatDueDate(item.dueDate)}
          {!sub && <span className={item.isOverdue ? "font-semibold text-red-600" : "text-gray-400"}>· {dueLabel(item.dueDate)}</span>}
        </span>
        <span className="inline-flex items-center gap-1">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />
          {item.teacherName || "—"}
        </span>
        {item.maxMarks != null && <span>Max marks: {numberish(item.maxMarks)}</span>}
        {item.attachmentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5 text-gray-400" />
            {item.attachmentCount} attachment{item.attachmentCount === 1 ? "" : "s"} (ask your teacher)
          </span>
        )}
      </div>

      {sub && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-gray-600">
              Submitted {formatDateTime(sub.submittedAt)}
              {sub.isLate && <span className="ml-1 font-semibold text-amber-700">(late)</span>}
            </span>
            {sub.marks != null && (
              <span className="rounded-md bg-white px-2 py-0.5 font-bold text-gray-900 ring-1 ring-gray-200">
                {numberish(sub.marks)}
                {item.maxMarks != null ? ` / ${numberish(item.maxMarks)}` : ""}
              </span>
            )}
          </div>
          {sub.feedback && (
            <p className="mt-2 flex gap-1.5 text-gray-700">
              <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="whitespace-pre-line">{sub.feedback}</span>
            </p>
          )}
        </div>
      )}
    </article>
  );
}
