"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useStaffOptions, useSubjects } from "@/lib/api/lookups";
import { DAYS, TIMETABLE_INVALIDATE, type TimetableEntry } from "../types";

export interface SlotTarget {
  sectionId: string;
  sectionLabel: string;
  academicYearId: string;
  dayOfWeek: number;
  periodNumber: number;
  start: string;
  end: string;
  entry?: TimetableEntry;
}

const EntryModal = ({ target, onClose }: { target: SlotTarget | null; onClose: () => void }) => {
  if (!target) return null;
  return (
    <EntryForm
      key={`${target.sectionId}-${target.dayOfWeek}-${target.periodNumber}-${target.entry?.id ?? "new"}`}
      target={target}
      onClose={onClose}
    />
  );
};

const EntryForm = ({ target, onClose }: { target: SlotTarget; onClose: () => void }) => {
  const subjects = useSubjects();
  const staff = useStaffOptions();
  const [form, setForm] = useState({
    subjectId: target.entry?.subject.id ?? "",
    staffId: target.entry?.staff.id ?? "",
    startTime: target.entry?.startTime ?? target.start,
    endTime: target.entry?.endTime ?? target.end,
    roomNumber: target.entry?.roomNumber ?? "",
  });
  const timeError = form.startTime && form.endTime && form.startTime >= form.endTime ? "End must be after start" : undefined;

  const save = useApiMutation(
    () =>
      api.put<TimetableEntry>("timetable/entries", {
        sectionId: target.sectionId,
        academicYearId: target.academicYearId,
        dayOfWeek: target.dayOfWeek,
        periodNumber: target.periodNumber,
        subjectId: form.subjectId,
        staffId: form.staffId,
        startTime: form.startTime,
        endTime: form.endTime,
        roomNumber: form.roomNumber.trim() || undefined,
      }),
    { invalidate: TIMETABLE_INVALIDATE, success: "Period saved", onSuccess: onClose },
  );

  const remove = useApiMutation(() => api.delete(`timetable/entries/${target.entry?.id}`), {
    invalidate: TIMETABLE_INVALIDATE,
    success: "Period cleared",
    onSuccess: onClose,
  });

  const day = DAYS.find((d) => d.value === target.dayOfWeek)?.label ?? "";
  const teachers = (staff.data ?? []).filter((s) => s.isTeachingStaff || s.id === form.staffId);

  return (
    <Modal
      open
      onClose={onClose}
      title={target.entry ? "Edit period" : "Add period"}
      description={`${target.sectionLabel} · ${day} · Period ${target.periodNumber}`}
      onSubmit={() => !timeError && save.mutate()}
      footer={
        <>
          {target.entry && (
            <Button
              variant="ghost"
              className="mr-auto text-red-600"
              onClick={() => remove.mutate()}
              loading={remove.isPending}
              disabled={save.isPending}
            >
              Remove
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={save.isPending || remove.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!!timeError || remove.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Subject" required className="col-span-2 sm:col-span-1">
          <Select
            required
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            placeholder={subjects.isLoading ? "Loading…" : "Select subject"}
            options={(subjects.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          />
        </Field>
        <Field label="Teacher" required className="col-span-2 sm:col-span-1">
          <Select
            required
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
            placeholder={staff.isLoading ? "Loading…" : teachers.length ? "Select teacher" : "No teaching staff found"}
            options={teachers.map((s) => ({ value: s.id, label: s.designation ? `${s.name} · ${s.designation}` : s.name }))}
          />
        </Field>
        <Field label="Start time" required>
          <Input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </Field>
        <Field label="End time" required error={timeError}>
          <Input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </Field>
        <Field label="Room" className="col-span-2" hint="Optional">
          <Input
            maxLength={32}
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            placeholder="e.g. 204 or Science Lab"
          />
        </Field>
      </div>
    </Modal>
  );
};

export default EntryModal;
