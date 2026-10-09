"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, EmptyState, Field, Input, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { formatDateTime } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import {
  ATTENDANCE_INVALIDATE,
  schoolToday,
  type AttendanceStatus,
  type MarkResult,
  type Roster,
  type StatusCounts,
} from "../types";
import AttendanceHeader from "./AttendanceHeader";
import AttendanceList, { type RowMark } from "./AttendanceList";
import LinkButton from "./LinkButton";

// Unsaved edits are keyed by section+date so switching either starts fresh
// from the server state.
type Draft = { key: string; marks: Record<string, RowMark> };

const MarkAttendanceTab = () => {
  const user = useUser();
  const today = schoolToday(user?.timezone);
  const sections = useSections();
  const [pickedSection, setPickedSection] = useState("");
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Draft>({ key: "", marks: {} });

  const sectionId = pickedSection || sections.data?.[0]?.id || "";
  const draftKey = `${sectionId}|${date}`;
  const edits = useMemo(() => (draft.key === draftKey ? draft.marks : {}), [draft, draftKey]);

  const roster = useApiQuery<Roster>(
    ["attendance", "roster", sectionId, date],
    sectionId && date ? "attendance/roster" : null,
    { sectionId, date },
  );

  // Effective marks = local edits over saved status; approved leave → Excused.
  const marks = useMemo(() => {
    const result: Record<string, RowMark> = {};
    roster.data?.students.forEach((s) => {
      result[s.studentId] = edits[s.studentId] ?? {
        status: s.status ?? (s.onLeave ? "EXCUSED" : null),
        remarks: s.remarks ?? (s.onLeave && !s.status ? "On approved leave" : ""),
      };
    });
    return result;
  }, [roster.data, edits]);

  const counts = useMemo(() => {
    const c: StatusCounts = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(marks).forEach((m) => {
      if (m.status) c[m.status.toLowerCase() as keyof StatusCounts] += 1;
    });
    return c;
  }, [marks]);

  const students = roster.data?.students ?? [];
  const unmarked = students.filter((s) => !marks[s.studentId]?.status).length;
  const hasEdits = Object.keys(edits).length > 0;
  const markOf = (studentId: string): RowMark => marks[studentId] ?? { status: null, remarks: "" };

  const updateMark = (studentId: string, patch: Partial<RowMark>) =>
    setDraft({ key: draftKey, marks: { ...edits, [studentId]: { ...markOf(studentId), ...patch } } });

  const markAllPresent = () => {
    const next: Record<string, RowMark> = { ...edits };
    students.forEach((s) => {
      // Students on approved leave keep their Excused status.
      if (s.onLeave && marks[s.studentId]?.status === "EXCUSED") return;
      next[s.studentId] = { ...markOf(s.studentId), status: "PRESENT" };
    });
    setDraft({ key: draftKey, marks: next });
  };

  const submit = useApiMutation(
    () =>
      api.post<MarkResult>("attendance/mark", {
        sectionId,
        date,
        periodNumber: 0,
        records: students.map((s) => ({
          studentId: s.studentId,
          status: markOf(s.studentId).status as AttendanceStatus,
          remarks: markOf(s.studentId).remarks.trim() || undefined,
        })),
      }),
    {
      invalidate: ATTENDANCE_INVALIDATE,
      success: (r) => `Attendance saved: ${r.present + r.late} of ${r.total} present`,
      onSuccess: () => setDraft({ key: "", marks: {} }),
    },
  );

  if (!sections.isLoading && !sections.error && !sections.data?.length) {
    return (
      <EmptyState
        title="No sections yet"
        description="Create classes and sections in Academic Setup before taking attendance."
        action={
          <LinkButton href="/dashboard/academics">Go to Academic Setup</LinkButton>
        }
      />
    );
  }

  const session = roster.data?.session;
  const isComplete = students.length > 0 && unmarked === 0;

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Section">
          <Select
            value={sectionId}
            onChange={(e) => setPickedSection(e.target.value)}
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
        </Field>
      </div>

      <QueryState
        isLoading={sections.isLoading || roster.isLoading}
        error={sections.error || roster.error}
        onRetry={() => (sections.error ? sections.refetch() : roster.refetch())}
        isEmpty={!students.length}
        empty={
          <EmptyState
            title="No students in this section"
            description="Enroll students into this section for the current academic year to take attendance."
            action={
              <LinkButton href="/dashboard/students" variant="secondary">Go to Students</LinkButton>
            }
          />
        }
      >
        {roster.data && (
          <>
            <AttendanceHeader
              sectionLabel={roster.data.section.label}
              date={roster.data.date}
              total={students.length}
              counts={counts}
              unmarked={unmarked}
              onMarkAllPresent={markAllPresent}
            />

            {session && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Already marked by <strong>{session.takenBy || "staff"}</strong> at {formatDateTime(session.markedAt)}.
                  Changes below will update it.
                </span>
              </div>
            )}

            <AttendanceList
              students={students}
              marks={marks}
              onStatusChange={(id, status) => updateMark(id, { status })}
              onRemarksChange={(id, remarks) => updateMark(id, { remarks })}
              disabled={submit.isPending}
            />

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              {hasEdits && (
                <Button variant="ghost" onClick={() => setDraft({ key: "", marks: {} })} disabled={submit.isPending}>
                  Discard changes
                </Button>
              )}
              <Button onClick={() => submit.mutate()} disabled={!isComplete} loading={submit.isPending} className="px-6 py-3">
                {!isComplete
                  ? `Mark all students to submit (${unmarked} left)`
                  : session
                    ? "Update Attendance"
                    : "Submit Attendance"}
              </Button>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
};

export default MarkAttendanceTab;
