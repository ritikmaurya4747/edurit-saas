"use client";

import { useState } from "react";
import { BarChart3, CalendarDays, ClipboardEdit, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, toDateInput, todayInput } from "@/lib/utils/format";
import { EXAM_INVALIDATE, type ExamListItem, type useExams } from "../api";
import ScheduleModal from "./ScheduleModal";

type ExamForm = { id?: string; name: string; startDate: string; endDate: string };

interface Props {
  academicYearId: string | null;
  exams: ReturnType<typeof useExams>;
  onOpenMarks: (examId: string) => void;
  onOpenResults: (examId: string) => void;
}

const ExamsTab = ({ academicYearId, exams, onOpenMarks, onOpenResults }: Props) => {
  const can = useCan();
  const canManage = can(PERMISSIONS.EXAM_CREATE);
  const canMarks = can(PERMISSIONS.MARKS_ENTRY);

  const [form, setForm] = useState<ExamForm | null>(null);
  const [toDelete, setToDelete] = useState<ExamListItem | null>(null);
  const [toPublish, setToPublish] = useState<ExamListItem | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  const save = useApiMutation(
    ({ id, ...body }: ExamForm) =>
      id ? api.patch(`exams/${id}`, body) : api.post("exams", { ...body, academicYearId: academicYearId ?? undefined }),
    { invalidate: EXAM_INVALIDATE, success: "Exam saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`exams/${id}`), {
    invalidate: EXAM_INVALIDATE,
    success: "Exam deleted",
    onSuccess: () => setToDelete(null),
  });
  const publish = useApiMutation(
    (exam: ExamListItem) => api.post(`exams/${exam.id}/publish`, { isPublished: !exam.isPublished }),
    {
      invalidate: EXAM_INVALIDATE,
      success: (r) => ((r as { isPublished?: boolean })?.isPublished ? "Results published" : "Exam moved back to draft"),
      onSuccess: () => setToPublish(null),
    },
  );

  const openCreate = () => {
    const today = todayInput();
    setForm({ name: "", startDate: today, endDate: today });
  };

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate} disabled={!academicYearId}>
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        </div>
      )}

      <QueryState
        isLoading={exams.isLoading}
        error={exams.error}
        onRetry={() => exams.refetch()}
        isEmpty={!exams.data?.length}
        empty={
          <EmptyState
            title="No exams for this academic year"
            description="Create an exam such as Unit Test 1 or Half Yearly, then add its subject schedule."
            action={canManage && <Button onClick={openCreate}>Create first exam</Button>}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.data?.map((exam) => (
            <Card key={exam.id} className="flex flex-col p-4">
              <button
                type="button"
                onClick={() => setScheduleId(exam.id)}
                className="mb-3 flex cursor-pointer items-start justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-900">{exam.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                  </p>
                </div>
                <Badge tone={exam.isPublished ? "green" : "gray"}>{exam.isPublished ? "Published" : "Draft"}</Badge>
              </button>

              <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-gray-500">Subjects</p>
                  <p className="text-sm font-bold text-gray-900">{exam.subjectCount}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-gray-500">Marks entered</p>
                  <p className="text-sm font-bold text-gray-900">{exam.marksEntered}</p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setScheduleId(exam.id)}>
                  <CalendarDays className="h-3.5 w-3.5" /> Schedule
                </Button>
                {canMarks && (
                  <Button variant="secondary" size="sm" onClick={() => onOpenMarks(exam.id)}>
                    <ClipboardEdit className="h-3.5 w-3.5" /> Marks
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => onOpenResults(exam.id)}>
                  <BarChart3 className="h-3.5 w-3.5" /> Results
                </Button>
                {canManage && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant={exam.isPublished ? "outline" : "success"}
                      size="sm"
                      onClick={() => setToPublish(exam)}
                    >
                      {exam.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit exam"
                      onClick={() =>
                        setForm({
                          id: exam.id,
                          name: exam.name,
                          startDate: toDateInput(exam.startDate),
                          endDate: toDateInput(exam.endDate),
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Delete exam" onClick={() => setToDelete(exam)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Exam" : "Create Exam"}
        description="Exam dates must fall within the selected academic year."
        onSubmit={() => form && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Exam name" required className="col-span-2">
              <Input
                required
                maxLength={128}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Half Yearly Examination"
              />
            </Field>
            <Field label="Start date" required className="col-span-2 sm:col-span-1">
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End date" required className="col-span-2 sm:col-span-1">
              <Input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="The exam and its schedule will be removed. Exams that already have marks cannot be deleted."
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={!!toPublish}
        onClose={() => setToPublish(null)}
        onConfirm={() => toPublish && publish.mutate(toPublish)}
        loading={publish.isPending}
        tone="primary"
        title={toPublish?.isPublished ? `Unpublish ${toPublish?.name}?` : `Publish ${toPublish?.name}?`}
        message={
          toPublish?.isPublished
            ? "Results will be hidden again and teachers can edit marks."
            : "Results become final: marks entry is locked until the exam is unpublished."
        }
        confirmLabel={toPublish?.isPublished ? "Unpublish" : "Publish"}
      />

      {scheduleId && <ScheduleModal examId={scheduleId} onClose={() => setScheduleId(null)} />}
    </div>
  );
};

export default ExamsTab;
