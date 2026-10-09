"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useCurrentAcademicYear, useSections } from "@/lib/api/lookups";
import { todayInput } from "@/lib/utils/format";
import { BLOOD_GROUPS, GENDER_OPTIONS, RELATIONSHIP_OPTIONS, type StudentProfile } from "../types";

const emptyForm = {
  firstName: "",
  lastName: "",
  admissionNumber: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  phone: "",
  email: "",
  address: "",
  admissionDate: "",
  sectionId: "",
  rollNumber: "",
  gFirstName: "",
  gLastName: "",
  gRelationship: "FATHER",
  gPhone: "",
  gEmail: "",
  gOccupation: "",
};

type Form = typeof emptyForm;
type Errors = Partial<Record<keyof Form, string>>;

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h4 className="col-span-2 mt-2 border-b border-gray-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 first:mt-0">
    {children}
  </h4>
);

const validate = (f: Form): Errors => {
  const errors: Errors = {};
  if (!f.firstName.trim()) errors.firstName = "First name is required";
  if (!f.dob) errors.dob = "Date of birth is required";
  else if (f.dob >= (f.admissionDate || todayInput())) errors.dob = "Must be before the admission date";
  if (!f.gender) errors.gender = "Select a gender";
  if (!f.sectionId) errors.sectionId = "Select a class & section";
  const guardianStarted = [f.gFirstName, f.gLastName, f.gPhone, f.gEmail, f.gOccupation].some((v) => v.trim());
  if (guardianStarted) {
    if (!f.gFirstName.trim()) errors.gFirstName = "Guardian's first name is required";
    if ((f.gPhone.match(/\d/g) ?? []).length < 6) errors.gPhone = "Enter a valid phone number";
  }
  return errors;
};

const AdmitStudentModal = ({
  open,
  onClose,
  onAdmitted,
}: {
  open: boolean;
  onClose: () => void;
  onAdmitted?: (student: StudentProfile) => void;
}) => {
  const sections = useSections();
  const currentYear = useCurrentAcademicYear();
  const [form, setForm] = useState<Form>({ ...emptyForm, admissionDate: todayInput() });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = () => {
    setForm({ ...emptyForm, admissionDate: todayInput() });
    setErrors({});
    onClose();
  };

  const admit = useApiMutation(
    (f: Form) => {
      const hasGuardian = !!f.gFirstName.trim();
      return api.post<StudentProfile>("students", {
        firstName: f.firstName,
        lastName: f.lastName,
        admissionNumber: f.admissionNumber || undefined,
        dob: f.dob,
        gender: f.gender,
        bloodGroup: f.bloodGroup || undefined,
        phone: f.phone || undefined,
        email: f.email || undefined,
        address: f.address || undefined,
        admissionDate: f.admissionDate || undefined,
        sectionId: f.sectionId,
        rollNumber: f.rollNumber ? Number(f.rollNumber) : undefined,
        guardian: hasGuardian
          ? {
              firstName: f.gFirstName,
              lastName: f.gLastName,
              relationship: f.gRelationship,
              phone: f.gPhone,
              email: f.gEmail || undefined,
              occupation: f.gOccupation || undefined,
            }
          : undefined,
      });
    },
    {
      invalidate: [["students"], ["dashboard"], ["sections"], ["classes"]],
      success: (s) => `${s.name} admitted (${s.admissionNumber})`,
      onSuccess: (s) => {
        close();
        onAdmitted?.(s);
      },
    },
  );

  const submit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) admit.mutate(form);
  };

  const sectionOptions = (sections.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.label} (${s.studentCount}/${s.capacity})`,
  }));
  const noSections = !sections.isLoading && sectionOptions.length === 0;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Admit Student"
      description={currentYear.data ? `Enrols the student for ${currentYear.data.name}` : undefined}
      size="lg"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={admit.isPending} disabled={noSections}>
            Admit Student
          </Button>
        </>
      }
    >
      {noSections && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No classes or sections are configured yet.{" "}
          <Link href="/dashboard/academics" className="font-bold underline">
            Set them up in Academic Setup
          </Link>{" "}
          before admitting students.
        </div>
      )}
      {!currentYear.isLoading && !currentYear.data && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No current academic year is set.{" "}
          <Link href="/dashboard/academics" className="font-bold underline">
            Mark one as current
          </Link>{" "}
          to enrol students.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <SectionTitle>Student details</SectionTitle>
        <Field label="First name" required error={errors.firstName} className="col-span-2 sm:col-span-1">
          <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Aarav" />
        </Field>
        <Field label="Last name" className="col-span-2 sm:col-span-1">
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Sharma" />
        </Field>
        <Field label="Date of birth" required error={errors.dob} className="col-span-2 sm:col-span-1">
          <Input type="date" max={todayInput()} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Gender" required error={errors.gender} className="col-span-2 sm:col-span-1">
          <Select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </Field>
        <Field label="Admission number" hint="Leave empty to auto-generate" className="col-span-2 sm:col-span-1">
          <Input
            value={form.admissionNumber}
            onChange={(e) => set("admissionNumber", e.target.value)}
            placeholder="ADM-2026-0001"
          />
        </Field>
        <Field label="Admission date" className="col-span-2 sm:col-span-1">
          <Input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
        </Field>
        <Field label="Blood group" className="col-span-2 sm:col-span-1">
          <Select
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
            options={BLOOD_GROUPS}
            placeholder="Not known"
          />
        </Field>
        <Field label="Student phone" className="col-span-2 sm:col-span-1">
          <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Student email" className="col-span-2 sm:col-span-1">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Address" className="col-span-2">
          <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>

        <SectionTitle>Class &amp; enrollment</SectionTitle>
        <Field label="Class & section" required error={errors.sectionId} className="col-span-2 sm:col-span-1">
          <Select
            value={form.sectionId}
            onChange={(e) => set("sectionId", e.target.value)}
            options={sectionOptions}
            placeholder={sections.isLoading ? "Loading…" : "Select section"}
          />
        </Field>
        <Field label="Roll number" hint="Leave empty for the next free number" className="col-span-2 sm:col-span-1">
          <Input type="number" min={1} value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} />
        </Field>

        <SectionTitle>Parent / Guardian (optional)</SectionTitle>
        <Field label="First name" error={errors.gFirstName} className="col-span-2 sm:col-span-1">
          <Input value={form.gFirstName} onChange={(e) => set("gFirstName", e.target.value)} />
        </Field>
        <Field label="Last name" className="col-span-2 sm:col-span-1">
          <Input value={form.gLastName} onChange={(e) => set("gLastName", e.target.value)} />
        </Field>
        <Field label="Relationship" className="col-span-2 sm:col-span-1">
          <Select
            value={form.gRelationship}
            onChange={(e) => set("gRelationship", e.target.value)}
            options={RELATIONSHIP_OPTIONS}
          />
        </Field>
        <Field label="Phone" error={errors.gPhone} className="col-span-2 sm:col-span-1">
          <Input type="tel" value={form.gPhone} onChange={(e) => set("gPhone", e.target.value)} />
        </Field>
        <Field label="Email" hint="Used for the parent's login" className="col-span-2 sm:col-span-1">
          <Input type="email" value={form.gEmail} onChange={(e) => set("gEmail", e.target.value)} />
        </Field>
        <Field label="Occupation" className="col-span-2 sm:col-span-1">
          <Input value={form.gOccupation} onChange={(e) => set("gOccupation", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};

export default AdmitStudentModal;
