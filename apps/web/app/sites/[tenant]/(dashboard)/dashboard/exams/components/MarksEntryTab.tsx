"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Lock, Save } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { EXAM_INVALIDATE, EXAM_KEY, fmtMarks, useExam, type ExamListItem, type MarksRoster } from "../api";

interface Props {
  exams: ExamListItem[];
  initialExamId?: string;
}

const MarksEntryTab = ({ exams, initialExamId }: Props) => {
  const sections = useSections();
  const [examId, setExamId] = useState(initialExamId || "");
  const [paperId, setPaperId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const exam = useExam(examId || null);
  const roster = useApiQuery<MarksRoster>(
    [EXAM_KEY, "marks", paperId],
    paperId && sectionId ? `exam-subjects/${paperId}/marks` : null,
    { sectionId },
  );

  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <Field label="Exam">
          <Select
            value={examId}
            onChange={(e) => {
              setExamId(e.target.value);
              setPaperId("");
            }}
            placeholder="Select exam"
            options={exams.map((x) => ({ value: x.id, label: `${x.name}${x.isPublished ? " (published)" : ""}` }))}
          />
        </Field>
        <Field label="Subject">
          <Select
            value={paperId}
            onChange={(e) => setPaperId(e.target.value)}
            disabled={!exam.data}
            placeholder={exam.isLoading ? "Loading…" : "Select subject"}
            options={(exam.data?.examSubjects ?? []).map((p) => ({
              value: p.id,
              label: `${p.subject.name} · ${formatDate(p.examDate)}`,
            }))}
          />
        </Field>
        <Field label="Section">
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            placeholder="Select section"
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
      </Card>

      {exam.data && exam.data.examSubjects.length === 0 && (
        <EmptyState title="This exam has no subjects yet" description="Open the exam's schedule on the Exams tab and add subject papers first." />
      )}

      {!paperId || !sectionId ? (
        exams.length === 0 ? (
          <EmptyState title="No exams yet" description="Create an exam on the Exams tab to start entering marks." />
        ) : (
          <EmptyState title="Pick an exam, subject and section" description="The student roster for marks entry will appear here." />
        )
      ) : (
        <QueryState
          isLoading={roster.isLoading}
          error={roster.error}
          onRetry={() => roster.refetch()}
          isEmpty={!roster.data?.students.length}
          empty={<EmptyState title="No students in this section" description="Enroll students in this section for the exam's academic year." />}
        >
          {roster.data && (
            <MarksEditor
              key={`${paperId}:${sectionId}:${roster.dataUpdatedAt}`}
              roster={roster.data}
              paperId={paperId}
              sectionId={sectionId}
            />
          )}
        </QueryState>
      )}
    </div>
  );
};

type Draft = { marks: string; remarks: string };
const EMPTY_DRAFT: Draft = { marks: "", remarks: "" };

const MarksEditor = ({ roster, paperId, sectionId }: { roster: MarksRoster; paperId: string; sectionId: string }) => {
  const can = useCan();
  const readOnly = roster.exam.isPublished || !can(PERMISSIONS.MARKS_ENTRY);
  const maxMarks = Number(roster.examSubject.maxMarks);
  const passingMarks = Number(roster.examSubject.passingMarks);

  const initial = useMemo(
    () =>
      Object.fromEntries(
        roster.students.map((s) => [
          s.studentId,
          { marks: s.marksObtained === null ? "" : String(s.marksObtained), remarks: s.remarks ?? "" },
        ]),
      ) as Record<string, Draft>,
    [roster],
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const errorFor = (value: string) => {
    if (value.trim() === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return "Not a number";
    if (n < 0 || n > maxMarks) return `0 – ${fmtMarks(maxMarks)}`;
    if (Math.round(n * 100) !== n * 100) return "Max 2 decimals";
    return null;
  };

  const draftOf = (id: string): Draft => drafts[id] ?? EMPTY_DRAFT;
  const initialOf = (id: string): Draft => initial[id] ?? EMPTY_DRAFT;
  const dirtyIds = roster.students
    .map((s) => s.studentId)
    .filter((id) => draftOf(id).marks.trim() !== initialOf(id).marks || draftOf(id).remarks.trim() !== initialOf(id).remarks);
  const invalid = roster.students.filter((s) => errorFor(draftOf(s.studentId).marks));
  const entered = roster.students.filter((s) => draftOf(s.studentId).marks.trim() !== "").length;

  const save = useApiMutation(
    () =>
      api.put<{ saved: number; cleared: number }>(`exam-subjects/${paperId}/marks`, {
        sectionId,
        marks: dirtyIds.map((id) => ({
          studentId: id,
          marksObtained: draftOf(id).marks.trim() === "" ? null : Number(draftOf(id).marks),
          remarks: draftOf(id).remarks.trim() || undefined,
        })),
      }),
    {
      invalidate: EXAM_INVALIDATE,
      success: (r) => `Marks saved (${r.saved} saved${r.cleared ? `, ${r.cleared} cleared` : ""})`,
    },
  );

  const setDraft = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_DRAFT), ...patch } }));

  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
      inputs.current[index + 1]?.select();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
      inputs.current[index - 1]?.select();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {roster.examSubject.subject.name} · {roster.section.label}
          </p>
          <p className="text-xs text-gray-500">
            Max {fmtMarks(maxMarks)} · Passing {fmtMarks(passingMarks)} · {entered}/{roster.students.length} entered · leave blank for
            absent
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-3">
            {dirtyIds.length > 0 ? (
              <Badge tone="yellow">{dirtyIds.length} unsaved change(s)</Badge>
            ) : (
              <span className="text-xs font-semibold text-gray-400">All changes saved</span>
            )}
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirtyIds.length || invalid.length > 0}>
              <Save className="h-4 w-4" /> Save marks
            </Button>
          </div>
        )}
      </div>

      {readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          <Lock className="h-3.5 w-3.5" />
          {roster.exam.isPublished
            ? "Results for this exam are published. Unpublish the exam to edit marks."
            : "You can view marks but do not have permission to enter them."}
        </div>
      )}
      {invalid.length > 0 && (
        <p className="text-xs font-semibold text-red-600">
          Fix {invalid.length} invalid mark(s) before saving (allowed: 0 – {fmtMarks(maxMarks)}).
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-[#FCFBF8] text-xs font-bold uppercase tracking-wider text-gray-400">
              <th className="w-16 px-4 py-3">Roll</th>
              <th className="px-4 py-3">Student</th>
              <th className="w-44 px-4 py-3">Marks / {fmtMarks(maxMarks)}</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {roster.students.map((s, index) => {
              const draft = draftOf(s.studentId);
              const error = errorFor(draft.marks);
              const value = draft.marks.trim() === "" ? null : Number(draft.marks);
              const failing = value !== null && !error && value < passingMarks;
              const dirty = dirtyIds.includes(s.studentId);
              return (
                <tr key={s.studentId} className={cn("border-b border-gray-100 last:border-0", dirty && "bg-amber-50/40")}>
                  <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{s.rollNumber ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-gray-900">{s.name}</p>
                    <p className="text-[11px] text-gray-400">{s.admissionNumber}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={(el) => {
                          inputs.current[index] = el;
                        }}
                        inputMode="decimal"
                        aria-label={`Marks for ${s.name}`}
                        disabled={readOnly}
                        value={draft.marks}
                        placeholder="AB"
                        onChange={(e) => setDraft(s.studentId, { marks: e.target.value })}
                        onKeyDown={onKeyDown(index)}
                        onFocus={(e) => e.target.select()}
                        className={cn(
                          "w-24 py-1.5 text-center font-bold",
                          error && "border-red-400 focus:border-red-500",
                          failing && "text-red-600",
                        )}
                      />
                      {error ? (
                        <span className="text-[11px] font-semibold text-red-600">{error}</span>
                      ) : value === null ? (
                        <span className="text-[11px] font-semibold text-gray-400">Absent</span>
                      ) : failing ? (
                        <span className="text-[11px] font-semibold text-red-500">Below pass</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      disabled={readOnly}
                      maxLength={500}
                      value={draft.remarks}
                      placeholder="Optional"
                      onChange={(e) => setDraft(s.studentId, { remarks: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          inputs.current[index + 1]?.focus();
                        }
                      }}
                      className="py-1.5"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirtyIds.length || invalid.length > 0}>
            <Save className="h-4 w-4" /> Save marks
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarksEntryTab;
