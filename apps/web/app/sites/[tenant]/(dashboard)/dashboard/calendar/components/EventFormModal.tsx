"use client";

import { useState } from "react";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import {
  AUDIENCE_OPTIONS,
  CALENDAR_KEYS,
  TYPE_OPTIONS,
  type CalendarAudience,
  type CalendarType,
  type EventForm,
} from "./utils";

// Create / edit a school calendar event (exams come from the Exams module).
const EventFormModal = ({ initial, onClose }: { initial: EventForm; onClose: () => void }) => {
  const [form, setForm] = useState<EventForm>(initial);
  const isEdit = !!initial.id;
  const dateError = form.startDate && form.endDate && form.endDate < form.startDate ? "End date cannot be before the start date" : undefined;

  const save = useApiMutation(
    ({ id, ...body }: EventForm) => (id ? api.patch(`calendar/events/${id}`, body) : api.post("calendar/events", body)),
    { invalidate: CALENDAR_KEYS, success: isEdit ? "Event updated" : "Event added", onSuccess: onClose },
  );

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (dateError) return;
    save.mutate({ ...form, title: form.title.trim(), description: form.description.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit event" : "Add event"}
      description="Holidays, PTMs and school events appear on everyone's calendar in the selected audience."
      size="lg"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!!dateError}>
            {isEdit ? "Save changes" : "Add event"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input
            required
            autoFocus
            maxLength={255}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Annual Sports Day"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type" required>
            <Select
              value={form.type}
              options={TYPE_OPTIONS}
              onChange={(e) => {
                const type = e.target.value as CalendarType;
                setForm((f) => ({ ...f, type, isHoliday: type === "HOLIDAY" }));
              }}
            />
          </Field>
          <Field label="Audience" required hint="Who can see this event">
            <Select
              value={form.targetRole}
              options={AUDIENCE_OPTIONS}
              onChange={(e) => set("targetRole", e.target.value as CalendarAudience)}
            />
          </Field>
          <Field label="Start date" required>
            <Input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setForm((f) => ({ ...f, startDate, endDate: !f.endDate || f.endDate < startDate ? startDate : f.endDate }));
              }}
            />
          </Field>
          <Field label="End date" required error={dateError} hint="Same as start for a one-day event">
            <Input
              type="date"
              required
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <Checkbox
            checked={form.isHoliday}
            onChange={(v) => set("isHoliday", v)}
            label={
              <span>
                <span className="font-semibold">School closed (holiday)</span>
                <span className="block text-xs text-gray-500">No classes or attendance on these days</span>
              </span>
            }
          />
        </div>
        <Field label="Description">
          <Textarea
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Timings, venue, instructions for students and parents…"
          />
        </Field>
      </div>
    </Modal>
  );
};

export default EventFormModal;
