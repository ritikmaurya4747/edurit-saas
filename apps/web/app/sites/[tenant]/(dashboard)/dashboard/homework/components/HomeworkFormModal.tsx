"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useSections, useStaffOptions, useSubjects } from "@/lib/api/lookups";
import { useUser } from "@/providers/user-provider";
import { HOMEWORK_INVALIDATE, type HomeworkDetail, type HomeworkItem } from "../types";

type FormState = {
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: string;
  staffId: string;
};

// Calendar date of an instant in the school's timezone ("YYYY-MM-DD").
const dateInZone = (value: string | Date, timeZone?: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || undefined }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date(value));
  }
};

const tomorrow = (timeZone?: string) => dateInZone(new Date(Date.now() + 24 * 60 * 60 * 1000), timeZone);

interface Props {
  // undefined = closed, null = create, item = edit
  homework: HomeworkItem | null | undefined;
  defaults?: { sectionId?: string; subjectId?: string };
  onClose: () => void;
  onSaved?: (homework: HomeworkDetail) => void;
}

const HomeworkFormModal = ({ homework, defaults, onClose, onSaved }: Props) => {
  if (homework === undefined) return null;
  return (
    <HomeworkForm
      key={homework?.id ?? "new"}
      homework={homework}
      defaults={defaults}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
};

const HomeworkForm = ({ homework, defaults, onClose, onSaved }: Props & { homework: HomeworkItem | null }) => {
  const user = useUser();
  const sections = useSections();
  const subjects = useSubjects();
  const staff = useStaffOptions();
  const canPickTeacher = !!user && (user.isAdmin || !user.staffId);

  const initialDue = homework ? dateInZone(homework.dueDate, user?.timezone) : tomorrow(user?.timezone);
  const [form, setForm] = useState<FormState>(() => ({
    sectionId: homework?.section.id ?? defaults?.sectionId ?? "",
    subjectId: homework?.subject.id ?? defaults?.subjectId ?? "",
    title: homework?.title ?? "",
    description: homework?.description ?? "",
    dueDate: initialDue,
    maxMarks: homework?.maxMarks != null ? String(Number(homework.maxMarks)) : "",
    staffId: homework?.staff.id ?? "",
  }));

  const save = useApiMutation(
    (f: FormState) => {
      const body = {
        sectionId: f.sectionId,
        subjectId: f.subjectId,
        title: f.title.trim(),
        description: f.description.trim(),
        maxMarks: f.maxMarks === "" ? (homework ? null : undefined) : Number(f.maxMarks),
        staffId: canPickTeacher && f.staffId ? f.staffId : undefined,
        // Keep the exact original due time unless the date was changed.
        dueDate: homework && f.dueDate === initialDue ? undefined : f.dueDate,
      };
      return homework
        ? api.patch<HomeworkDetail>(`homework/${homework.id}`, body)
        : api.post<HomeworkDetail>("homework", body);
    },
    {
      invalidate: HOMEWORK_INVALIDATE,
      success: homework ? "Homework updated" : "Homework assigned",
      onSuccess: (result) => {
        onSaved?.(result);
        onClose();
      },
    },
  );

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal
      open
      onClose={onClose}
      title={homework ? "Edit Homework" : "Assign Homework"}
      size="lg"
      onSubmit={() => save.mutate(form)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {homework ? "Save changes" : "Assign"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Section" required className="col-span-2 sm:col-span-1">
          <Select
            required
            value={form.sectionId}
            onChange={(e) => set({ sectionId: e.target.value })}
            placeholder="Select section"
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
        <Field label="Subject" required className="col-span-2 sm:col-span-1">
          <Select
            required
            value={form.subjectId}
            onChange={(e) => set({ subjectId: e.target.value })}
            placeholder="Select subject"
            options={(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <Field label="Title" required className="col-span-2">
          <Input
            required
            maxLength={255}
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Chapter 4 – Exercise 4.2"
          />
        </Field>
        <Field label="Description" required className="col-span-2">
          <Textarea
            required
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="What should students do?"
          />
        </Field>
        <Field label="Due date" required className="col-span-2 sm:col-span-1" hint="Due by the end of this day">
          <Input type="date" required value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
        </Field>
        <Field label="Max marks" className="col-span-2 sm:col-span-1" hint="Leave empty if not graded">
          <Input
            type="number"
            min={0}
            max={999}
            step="0.5"
            value={form.maxMarks}
            onChange={(e) => set({ maxMarks: e.target.value })}
            placeholder="e.g. 10"
          />
        </Field>
        {canPickTeacher && (
          <Field label="Teacher" className="col-span-2" hint="Defaults to you when left empty">
            <Select
              value={form.staffId}
              onChange={(e) => set({ staffId: e.target.value })}
              placeholder="Me"
              options={(staff.data ?? [])
                .filter((s) => s.isTeachingStaff || s.id === form.staffId)
                .map((s) => ({ value: s.id, label: s.designation ? `${s.name} · ${s.designation}` : s.name }))}
            />
          </Field>
        )}
      </div>
    </Modal>
  );
};

export default HomeworkFormModal;
