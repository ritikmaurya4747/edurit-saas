"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useSubjects } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, toDateInput } from "@/lib/utils/format";
import { EXAM_INVALIDATE, fmtMarks, useExam, type ExamSubjectItem } from "../api";

type PaperForm = { subjectId: string; examDate: string; maxMarks: string; passingMarks: string; paperPdfUrl: string };

const toBody = (f: PaperForm) => ({
  subjectId: f.subjectId,
  examDate: f.examDate,
  maxMarks: Number(f.maxMarks),
  passingMarks: Number(f.passingMarks),
  ...(f.paperPdfUrl.trim() ? { paperPdfUrl: f.paperPdfUrl.trim() } : {}),
});

const ScheduleModal = ({ examId, onClose }: { examId: string; onClose: () => void }) => {
  const can = useCan();
  const canManage = can(PERMISSIONS.EXAM_CREATE);
  const exam = useExam(examId);
  const subjects = useSubjects();

  const emptyForm = (): PaperForm => ({
    subjectId: "",
    examDate: toDateInput(exam.data?.startDate),
    maxMarks: "100",
    passingMarks: "33",
    paperPdfUrl: "",
  });

  const [addForm, setAddForm] = useState<PaperForm | null>(null);
  const [editing, setEditing] = useState<{ id: string; form: PaperForm } | null>(null);
  const [toRemove, setToRemove] = useState<ExamSubjectItem | null>(null);

  const add = useApiMutation((f: PaperForm) => api.post(`exams/${examId}/subjects`, toBody(f)), {
    invalidate: EXAM_INVALIDATE,
    success: "Subject added to schedule",
    onSuccess: () => setAddForm(emptyForm()),
  });
  const update = useApiMutation(
    ({ id, form }: { id: string; form: PaperForm }) =>
      api.patch(`exam-subjects/${id}`, { ...toBody(form), paperPdfUrl: form.paperPdfUrl.trim() || null }),
    { invalidate: EXAM_INVALIDATE, success: "Schedule updated", onSuccess: () => setEditing(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`exam-subjects/${id}`), {
    invalidate: EXAM_INVALIDATE,
    success: "Subject removed from schedule",
    onSuccess: () => setToRemove(null),
  });

  const scheduledIds = useMemo(() => new Set(exam.data?.examSubjects.map((s) => s.subjectId)), [exam.data]);
  const subjectOptions = (keep?: string) =>
    (subjects.data ?? [])
      .filter((s) => s.id === keep || !scheduledIds.has(s.id))
      .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  const minDate = toDateInput(exam.data?.startDate);
  const maxDate = toDateInput(exam.data?.endDate);

  const submitAdd = (e: FormEvent) => {
    e.preventDefault();
    if (addForm) add.mutate(addForm);
  };

  const paperFields = (form: PaperForm, set: (f: PaperForm) => void, keepSubject?: string) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
      <Field label="Subject" required className="col-span-2">
        <Select
          required
          value={form.subjectId}
          onChange={(e) => set({ ...form, subjectId: e.target.value })}
          placeholder="Select subject"
          options={subjectOptions(keepSubject)}
        />
      </Field>
      <Field label="Date" required className="col-span-2 sm:col-span-1">
        <Input type="date" required min={minDate} max={maxDate} value={form.examDate} onChange={(e) => set({ ...form, examDate: e.target.value })} />
      </Field>
      <Field label="Max marks" required>
        <Input type="number" required min={1} max={999} step="0.5" value={form.maxMarks} onChange={(e) => set({ ...form, maxMarks: e.target.value })} />
      </Field>
      <Field label="Passing" required>
        <Input
          type="number"
          required
          min={0}
          max={Number(form.maxMarks) || 999}
          step="0.5"
          value={form.passingMarks}
          onChange={(e) => set({ ...form, passingMarks: e.target.value })}
        />
      </Field>
      <Field label="Paper link" className="col-span-2 sm:col-span-6">
        <Input type="url" value={form.paperPdfUrl} onChange={(e) => set({ ...form, paperPdfUrl: e.target.value })} placeholder="https://… (optional)" />
      </Field>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={exam.data ? `${exam.data.name} — Schedule` : "Exam schedule"}
      description={
        exam.data
          ? `${formatDate(exam.data.startDate)} – ${formatDate(exam.data.endDate)} · ${exam.data.academicYear.name}`
          : undefined
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <QueryState isLoading={exam.isLoading} error={exam.error} onRetry={() => exam.refetch()}>
        {exam.data && (
          <div className="space-y-5">
            {exam.data.isPublished && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
                Results are published. Maximum / passing marks are locked until the exam is unpublished.
              </div>
            )}

            {exam.data.examSubjects.length === 0 ? (
              <EmptyState title="No subjects scheduled" description="Add each subject paper with its date and marks." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#FCFBF8] text-xs font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-center">Max</th>
                      <th className="px-4 py-3 text-center">Passing</th>
                      <th className="px-4 py-3 text-center">Marks entered</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {exam.data.examSubjects.map((paper) =>
                      editing?.id === paper.id ? (
                        <tr key={paper.id} className="border-b border-gray-100 bg-gray-50/60">
                          <td colSpan={6} className="px-4 py-3">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                update.mutate(editing);
                              }}
                            >
                              {paperFields(editing.form, (form) => setEditing({ id: paper.id, form }), paper.subjectId)}
                              <div className="mt-3 flex justify-end gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit" size="sm" loading={update.isPending}>
                                  Save
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : (
                        <tr key={paper.id} className="border-b border-gray-100 last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">{formatDate(paper.examDate, true)}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">{paper.subject.name}</span>
                            <span className="ml-2 text-xs font-bold uppercase text-gray-400">{paper.subject.code}</span>
                            {paper.paperPdfUrl && (
                              <a
                                href={paper.paperPdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                              >
                                <FileText className="h-3 w-3" /> Paper
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{fmtMarks(paper.maxMarks)}</td>
                          <td className="px-4 py-3 text-center">{fmtMarks(paper.passingMarks)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge tone={paper.marksCount ? "blue" : "gray"}>{paper.marksCount}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {canManage && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Edit paper"
                                  onClick={() =>
                                    setEditing({
                                      id: paper.id,
                                      form: {
                                        subjectId: paper.subjectId,
                                        examDate: toDateInput(paper.examDate),
                                        maxMarks: String(Number(paper.maxMarks)),
                                        passingMarks: String(Number(paper.passingMarks)),
                                        paperPdfUrl: paper.paperPdfUrl ?? "",
                                      },
                                    })
                                  }
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Remove paper"
                                  disabled={paper.marksCount > 0}
                                  title={paper.marksCount > 0 ? "Marks are entered for this paper" : undefined}
                                  onClick={() => setToRemove(paper)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {canManage &&
              (addForm ? (
                <form onSubmit={submitAdd} className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4">
                  <p className="mb-3 text-sm font-bold text-gray-800">Add subject paper</p>
                  {paperFields(addForm, setAddForm)}
                  {subjectOptions().length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">Every subject is already scheduled. Add more subjects in Academic Setup.</p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setAddForm(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={add.isPending}>
                      Add to schedule
                    </Button>
                  </div>
                </form>
              ) : (
                <Button variant="outline" onClick={() => setAddForm(emptyForm())}>
                  <Plus className="h-4 w-4" /> Add subject
                </Button>
              ))}
          </div>
        )}
      </QueryState>

      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => toRemove && remove.mutate(toRemove.id)}
        loading={remove.isPending}
        title={`Remove ${toRemove?.subject.name}?`}
        message="The paper will be removed from this exam's schedule."
        confirmLabel="Remove"
      />
    </Modal>
  );
};

export default ScheduleModal;
