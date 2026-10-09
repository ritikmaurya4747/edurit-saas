"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { todayInput } from "@/lib/utils/format";
import { GENDER_OPTIONS, type Enquiry } from "../types";

interface AdmitResult {
  enquiry: Enquiry;
  student: { id: string; name: string; admissionNumber: string };
}

const AdmitModal = ({ enquiry, onClose }: { enquiry: Enquiry | null; onClose: () => void }) => (
  <Modal
    open={!!enquiry}
    onClose={onClose}
    title={enquiry ? `Admit ${enquiry.studentName}` : "Admit"}
    description="Creates the student record, class enrollment and the parent's login"
  >
    {enquiry && <AdmitForm key={enquiry.id} enquiry={enquiry} onClose={onClose} />}
  </Modal>
);

const AdmitForm = ({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) => {
  const sections = useSections();
  const [form, setForm] = useState(() => {
    // Preselect the first section of the class applied for.
    const match = sections.data?.find((s) => s.className.toLowerCase() === enquiry.classApplied.toLowerCase());
    return {
      sectionId: match?.id ?? "",
      admissionNumber: "",
      rollNumber: "",
      dob: "",
      gender: "",
      guardianEmail: enquiry.email ?? "",
    };
  });

  const admit = useApiMutation(
    () =>
      api.post<AdmitResult>(`admissions/${enquiry.id}/admit`, {
        sectionId: form.sectionId,
        admissionNumber: form.admissionNumber || undefined,
        rollNumber: form.rollNumber ? Number(form.rollNumber) : undefined,
        dob: enquiry.dob ? undefined : form.dob,
        gender: enquiry.gender ? undefined : form.gender,
        guardianEmail: form.guardianEmail || undefined,
      }),
    {
      invalidate: [["admissions"], ["students"], ["dashboard"], ["sections"], ["classes"]],
      onSuccess: (result) => {
        toast.success(
          () => (
            <span className="text-sm">
              {result.student.name} admitted ({result.student.admissionNumber}).{" "}
              <Link href={`/dashboard/students/${result.student.id}`} className="font-bold underline">
                View student
              </Link>
            </span>
          ),
          { duration: 6000 },
        );
        onClose();
      },
    },
  );

  const matching = (sections.data ?? []).filter(
    (s) => s.className.toLowerCase() === enquiry.classApplied.toLowerCase(),
  );
  const options = (sections.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.label} (${s.studentCount}/${s.capacity})`,
  }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        admit.mutate();
      }}
    >
      <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Applied for <span className="font-bold text-gray-800">{enquiry.classApplied}</span>
        {enquiry.parentName && (
          <>
            {" "}
            · Parent <span className="font-bold text-gray-800">{enquiry.parentName}</span>
          </>
        )}{" "}
        · {enquiry.phone}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Class & section"
          required
          className="col-span-2"
          hint={
            !sections.isLoading && options.length === 0
              ? "No sections configured — add them in Academic Setup"
              : matching.length === 0
                ? `No class named "${enquiry.classApplied}" — pick the right section`
                : undefined
          }
        >
          <Select
            required
            value={form.sectionId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            options={options}
            placeholder={sections.isLoading ? "Loading…" : "Select section"}
          />
        </Field>
        {!enquiry.dob && (
          <Field label="Date of birth" required className="col-span-2 sm:col-span-1">
            <Input
              required
              type="date"
              max={todayInput()}
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </Field>
        )}
        {!enquiry.gender && (
          <Field label="Gender" required className="col-span-2 sm:col-span-1">
            <Select
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />
          </Field>
        )}
        <Field label="Admission number" hint="Leave empty to auto-generate" className="col-span-2 sm:col-span-1">
          <Input value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
        </Field>
        <Field label="Roll number" hint="Next free number if empty" className="col-span-2 sm:col-span-1">
          <Input
            type="number"
            min={1}
            value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
          />
        </Field>
        <Field label="Parent email" hint="Optional — used for the parent's login" className="col-span-2">
          <Input
            type="email"
            value={form.guardianEmail}
            onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })}
          />
        </Field>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-gray-100 px-5 pt-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={admit.isPending} disabled={options.length === 0}>
          Admit student
        </Button>
      </div>
    </form>
  );
};

export default AdmitModal;
