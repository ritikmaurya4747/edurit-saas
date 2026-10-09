"use client";

import { useState } from "react";
import { Button, Field, Input, LoadingState, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useBranches } from "@/lib/api/lookups";
import { toDateInput } from "@/lib/utils/format";
import { BLOOD_GROUPS, GENDER_OPTIONS, STATUS_OPTIONS, type StudentProfile } from "../types";

type Form = {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  admissionDate: string;
  branchId: string;
  status: string;
};

const toForm = (s: StudentProfile): Form => ({
  firstName: s.firstName,
  lastName: s.lastName,
  admissionNumber: s.admissionNumber,
  dob: toDateInput(s.dob),
  gender: s.gender,
  bloodGroup: s.bloodGroup ?? "",
  phone: s.phone ?? "",
  email: s.email ?? "",
  address: s.address ?? "",
  admissionDate: toDateInput(s.admissionDate),
  branchId: s.branchId,
  status: s.status,
});

// Edit profile fields. Loads the profile itself so it can be opened from the
// list (already cached when opened from the profile page).
const EditStudentModal = ({ studentId, onClose }: { studentId: string | null; onClose: () => void }) => {
  const student = useApiQuery<StudentProfile>(["students", "detail", studentId], studentId ? `students/${studentId}` : null);
  const ready = !!studentId && student.data?.id === studentId;

  return (
    <Modal
      open={!!studentId}
      onClose={onClose}
      title={ready && student.data ? `Edit ${student.data.name}` : "Edit Student"}
      size="lg"
    >
      {ready && student.data ? (
        <EditForm key={student.data.id} student={student.data} onClose={onClose} />
      ) : student.error ? (
        <p className="text-sm text-red-600">{student.error.message}</p>
      ) : (
        <LoadingState />
      )}
    </Modal>
  );
};

const EditForm = ({ student, onClose }: { student: StudentProfile; onClose: () => void }) => {
  const branches = useBranches();
  const [form, setForm] = useState<Form>(() => toForm(student));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = useApiMutation(
    (f: Form) =>
      api.patch<StudentProfile>(`students/${student.id}`, {
        ...f,
        // null clears an optional field
        bloodGroup: f.bloodGroup || null,
        phone: f.phone || null,
        email: f.email || null,
        address: f.address || null,
      }),
    { invalidate: [["students"], ["dashboard"]], success: "Student updated", onSuccess: onClose },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" required className="col-span-2 sm:col-span-1">
          <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </Field>
        <Field label="Last name" className="col-span-2 sm:col-span-1">
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
        <Field label="Admission number" required className="col-span-2 sm:col-span-1">
          <Input required value={form.admissionNumber} onChange={(e) => set("admissionNumber", e.target.value)} />
        </Field>
        <Field label="Status" required className="col-span-2 sm:col-span-1">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Date of birth" required className="col-span-2 sm:col-span-1">
          <Input required type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Gender" required className="col-span-2 sm:col-span-1">
          <Select required value={form.gender} onChange={(e) => set("gender", e.target.value)} options={GENDER_OPTIONS} />
        </Field>
        <Field label="Admission date" required className="col-span-2 sm:col-span-1">
          <Input required type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
        </Field>
        <Field label="Blood group" className="col-span-2 sm:col-span-1">
          <Select
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
            options={BLOOD_GROUPS}
            placeholder="Not known"
          />
        </Field>
        <Field label="Phone" className="col-span-2 sm:col-span-1">
          <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email" className="col-span-2 sm:col-span-1">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        {(branches.data?.length ?? 0) > 1 && (
          <Field label="Branch" className="col-span-2">
            <Select
              value={form.branchId}
              onChange={(e) => set("branchId", e.target.value)}
              options={(branches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </Field>
        )}
        <Field label="Address" className="col-span-2">
          <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-gray-100 px-5 pt-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
};

export default EditStudentModal;
