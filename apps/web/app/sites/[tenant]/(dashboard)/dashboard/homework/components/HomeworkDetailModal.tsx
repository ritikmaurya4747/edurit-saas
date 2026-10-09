"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, EmptyState, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/utils/format";
import { HOMEWORK_INVALIDATE, isOverdue, type HomeworkDetail, type HomeworkRosterRow } from "../types";
import HomeworkFormModal from "./HomeworkFormModal";

interface Props {
  homeworkId: string | null;
  onClose: () => void;
}

const HomeworkDetailModal = ({ homeworkId, onClose }: Props) => {
  const can = useCan();
  const canManage = can(PERMISSIONS.HOMEWORK_MANAGE);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const detail = useApiQuery<HomeworkDetail>(["homework", "detail", homeworkId], homeworkId ? `homework/${homeworkId}` : null);
  const hw = detail.data;

  const remove = useApiMutation(() => api.delete(`homework/${homeworkId}`), {
    invalidate: HOMEWORK_INVALIDATE,
    success: "Homework deleted",
    onSuccess: () => {
      setConfirmDelete(false);
      onClose();
    },
  });

  if (!homeworkId) return null;

  const maxMarks = hw?.maxMarks != null ? Number(hw.maxMarks) : null;

  return (
    <>
      <Modal
        open={!editing && !confirmDelete}
        onClose={onClose}
        size="xl"
        title={hw?.title ?? "Homework"}
        description={hw ? `${hw.subject.name} · ${hw.section.label} · assigned by ${hw.staff.name || "—"}` : undefined}
        footer={
          <>
            {canManage && hw && (
              <>
                <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        }
      >
        <QueryState isLoading={detail.isLoading} error={detail.error} onRetry={() => detail.refetch()}>
          {hw && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone={isOverdue(hw.dueDate) ? "red" : "yellow"}>
                  {isOverdue(hw.dueDate) ? "Was due" : "Due"} {formatDateTime(hw.dueDate)}
                </Badge>
                <Badge tone="blue">
                  {hw.counts.submitted}/{hw.counts.totalStudents} submitted
                </Badge>
                {maxMarks != null && <Badge tone="purple">Max marks {maxMarks}</Badge>}
                {hw.counts.graded > 0 && <Badge tone="green">{hw.counts.graded} graded</Badge>}
              </div>
              <p className="mb-5 whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{hw.description}</p>

              {hw.roster.length === 0 ? (
                <EmptyState
                  title="No students in this section"
                  description="Students enrolled in this section for the current year will appear here."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-170 text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#FCFBF8]">
                        {["Roll", "Student", "Submitted", "Marks", "Feedback", ""].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hw.roster.map((row) => (
                        <SubmissionRow
                          key={`${row.studentId}-${row.submission?.id ?? "none"}-${row.submission?.gradedAt ?? ""}`}
                          homeworkId={hw.id}
                          row={row}
                          maxMarks={maxMarks}
                          readOnly={!canManage}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </QueryState>
      </Modal>

      <HomeworkFormModal homework={editing && hw ? hw : undefined} onClose={() => setEditing(false)} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title={`Delete "${hw?.title}"?`}
        message="The homework and its submission records will no longer be visible."
        confirmLabel="Delete"
      />
    </>
  );
};

const SubmissionRow = ({
  homeworkId,
  row,
  maxMarks,
  readOnly,
}: {
  homeworkId: string;
  row: HomeworkRosterRow;
  maxMarks: number | null;
  readOnly: boolean;
}) => {
  const initial = {
    submitted: !!row.submission,
    marks: row.submission?.marks != null ? String(Number(row.submission.marks)) : "",
    feedback: row.submission?.feedback ?? "",
  };
  const [state, setState] = useState(initial);
  const dirty =
    state.submitted !== initial.submitted || state.marks !== initial.marks || state.feedback !== initial.feedback;
  const marksNumber = state.marks === "" ? null : Number(state.marks);
  const marksError =
    marksNumber != null && (Number.isNaN(marksNumber) || marksNumber < 0 || (maxMarks != null && marksNumber > maxMarks));

  const save = useApiMutation(
    () =>
      api.put(`homework/${homeworkId}/submissions/${row.studentId}`, {
        submitted: state.submitted,
        ...(state.submitted && { marks: marksNumber, feedback: state.feedback.trim() || null }),
      }),
    { invalidate: HOMEWORK_INVALIDATE, success: `Saved for ${row.name}` },
  );

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="w-14 px-3 py-2.5 font-medium text-gray-600">{row.rollNumber ?? "—"}</td>
      <td className="px-3 py-2.5">
        <div className="font-bold text-gray-900">{row.name}</div>
        {row.submission && (
          <div className="text-[11px] text-gray-400">Submitted {formatDateTime(row.submission.submittedAt)}</div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={state.submitted}
            disabled={readOnly}
            onChange={(e) =>
              setState((s) => ({ ...s, submitted: e.target.checked, ...(!e.target.checked && { marks: "", feedback: "" }) }))
            }
            className="h-4 w-4 accent-[#1C263A]"
          />
          <span className={`text-xs font-bold ${state.submitted ? "text-green-700" : "text-gray-400"}`}>
            {state.submitted ? "Yes" : "No"}
          </span>
        </label>
      </td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          min={0}
          max={maxMarks ?? 999}
          step="0.5"
          value={state.marks}
          disabled={readOnly || !state.submitted}
          onChange={(e) => setState((s) => ({ ...s, marks: e.target.value }))}
          placeholder={maxMarks != null ? `/ ${maxMarks}` : "—"}
          className={`w-20 rounded-md border px-2 py-1.5 text-xs outline-none focus:border-[#1C263A] disabled:bg-gray-50 ${
            marksError ? "border-red-400" : "border-gray-200"
          }`}
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          value={state.feedback}
          maxLength={2000}
          disabled={readOnly || !state.submitted}
          onChange={(e) => setState((s) => ({ ...s, feedback: e.target.value }))}
          placeholder="Optional"
          className="w-full min-w-40 rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#1C263A] disabled:bg-gray-50"
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        {!readOnly && (
          <Button size="sm" disabled={!dirty || marksError} loading={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        )}
      </td>
    </tr>
  );
};

export default HomeworkDetailModal;
