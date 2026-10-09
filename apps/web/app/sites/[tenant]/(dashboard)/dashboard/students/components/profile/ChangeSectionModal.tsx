"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useAcademicYears, useSections } from "@/lib/api/lookups";
import type { StudentProfile } from "../../types";

// Create or move the student's enrollment for an academic year.
const ChangeSectionModal = ({
  student,
  open,
  onClose,
}: {
  student: StudentProfile;
  open: boolean;
  onClose: () => void;
}) => {
  const sections = useSections();
  const years = useAcademicYears();
  const currentYearId = years.data?.find((y) => y.isCurrent)?.id ?? "";
  const [form, setForm] = useState({ academicYearId: "", sectionId: "", rollNumber: "" });

  const yearId = form.academicYearId || currentYearId;
  const existing = student.enrollments.find((e) => e.academicYear.id === yearId);

  const close = () => {
    setForm({ academicYearId: "", sectionId: "", rollNumber: "" });
    onClose();
  };

  const save = useApiMutation(
    () =>
      api.put(`students/${student.id}/enrollment`, {
        sectionId: form.sectionId || existing?.section.id,
        academicYearId: yearId || undefined,
        rollNumber: form.rollNumber ? Number(form.rollNumber) : undefined,
      }),
    {
      invalidate: [["students"], ["sections"], ["classes"], ["dashboard"]],
      success: "Enrollment updated",
      onSuccess: close,
    },
  );

  const sectionId = form.sectionId || existing?.section.id || "";

  return (
    <Modal
      open={open}
      onClose={close}
      title={existing ? "Change Section" : "Enrol in Section"}
      description={
        existing
          ? `Currently ${existing.sectionLabel}${existing.rollNumber ? `, roll ${existing.rollNumber}` : ""}`
          : "The student has no enrollment for this year yet."
      }
      size="sm"
      onSubmit={() => sectionId && save.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!sectionId}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Field label="Academic year" required>
          <Select
            value={yearId}
            onChange={(e) => setForm({ ...form, academicYearId: e.target.value, sectionId: "", rollNumber: "" })}
            options={(years.data ?? []).map((y) => ({ value: y.id, label: `${y.name}${y.isCurrent ? " (current)" : ""}` }))}
          />
        </Field>
        <Field label="Class & section" required>
          <Select
            required
            value={sectionId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: `${s.label} (${s.studentCount}/${s.capacity})` }))}
            placeholder="Select section"
          />
        </Field>
        <Field label="Roll number" hint="Leave empty to keep the current one or use the next free number">
          <Input
            type="number"
            min={1}
            value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            placeholder={existing?.rollNumber ? String(existing.rollNumber) : undefined}
          />
        </Field>
      </div>
    </Modal>
  );
};

export default ChangeSectionModal;
