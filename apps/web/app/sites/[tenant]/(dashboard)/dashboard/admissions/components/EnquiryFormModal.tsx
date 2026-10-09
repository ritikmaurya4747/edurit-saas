"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { toDateInput, todayInput } from "@/lib/utils/format";
import { GENDER_OPTIONS, SOURCE_OPTIONS, type Enquiry } from "../types";

type Form = {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  classApplied: string;
  source: string;
  notes: string;
};

const toForm = (e?: Enquiry | null): Form => ({
  studentName: e?.studentName ?? "",
  parentName: e?.parentName ?? "",
  phone: e?.phone ?? "",
  email: e?.email ?? "",
  dob: toDateInput(e?.dob),
  gender: e?.gender ?? "",
  classApplied: e?.classApplied ?? "",
  source: e?.source ?? "WALK_IN",
  notes: e?.notes ?? "",
});

// `enquiry` undefined = closed, null = create, Enquiry = edit.
const EnquiryFormModal = ({ enquiry, onClose }: { enquiry: Enquiry | null | undefined; onClose: () => void }) => (
  <Modal
    open={enquiry !== undefined}
    onClose={onClose}
    title={enquiry ? `Edit ${enquiry.studentName}` : "New Enquiry"}
    description={enquiry ? undefined : "Record a prospective student's admission enquiry"}
    size="lg"
  >
    {enquiry !== undefined && <EnquiryForm key={enquiry?.id ?? "new"} enquiry={enquiry} onClose={onClose} />}
  </Modal>
);

const EnquiryForm = ({ enquiry, onClose }: { enquiry: Enquiry | null; onClose: () => void }) => {
  const classes = useClasses();
  const [form, setForm] = useState<Form>(() => toForm(enquiry));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const classNames = (classes.data ?? []).map((c) => c.name);
  // Keep a free-text value from an older enquiry selectable.
  if (form.classApplied && classNames.length && !classNames.includes(form.classApplied)) classNames.push(form.classApplied);

  const save = useApiMutation(
    (f: Form) => {
      const body = {
        ...f,
        parentName: f.parentName || null,
        email: f.email || null,
        dob: f.dob || null,
        gender: f.gender || null,
        notes: f.notes || null,
      };
      return enquiry ? api.patch<Enquiry>(`admissions/${enquiry.id}`, body) : api.post<Enquiry>("admissions", body);
    },
    {
      invalidate: [["admissions"], ["dashboard"]],
      success: enquiry ? "Enquiry updated" : "Enquiry added",
      onSuccess: onClose,
    },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Student name" required className="col-span-2 sm:col-span-1">
          <Input required value={form.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="Aarav Sharma" />
        </Field>
        <Field label="Class applied for" required className="col-span-2 sm:col-span-1">
          {classNames.length ? (
            <Select
              required
              value={form.classApplied}
              onChange={(e) => set("classApplied", e.target.value)}
              options={classNames.map((n) => ({ value: n, label: n }))}
              placeholder="Select class"
            />
          ) : (
            <Input
              required
              value={form.classApplied}
              onChange={(e) => set("classApplied", e.target.value)}
              placeholder="Class 1"
            />
          )}
        </Field>
        <Field label="Parent name" className="col-span-2 sm:col-span-1">
          <Input value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Rakesh Sharma" />
        </Field>
        <Field label="Phone" required className="col-span-2 sm:col-span-1">
          <Input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email" className="col-span-2 sm:col-span-1">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Source" className="col-span-2 sm:col-span-1">
          <Select value={form.source} onChange={(e) => set("source", e.target.value)} options={SOURCE_OPTIONS} />
        </Field>
        <Field label="Date of birth" className="col-span-2 sm:col-span-1">
          <Input type="date" max={todayInput()} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Gender" className="col-span-2 sm:col-span-1">
          <Select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Not specified"
          />
        </Field>
        <Field label="Notes" className="col-span-2">
          <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-gray-100 px-5 pt-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {enquiry ? "Save" : "Add enquiry"}
        </Button>
      </div>
    </form>
  );
};

export default EnquiryFormModal;
