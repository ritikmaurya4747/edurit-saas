"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useAcademicYears, useSections, useStudentOptions } from "@/lib/api/lookups";
import type { PromoteResult } from "../types";

const emptyForm = { fromSectionId: "", toAcademicYearId: "", toSectionId: "" };

const PromoteModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const sections = useSections();
  const years = useAcademicYears();
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<PromoteResult | null>(null);

  // Preview: how many active students are in the source section this year.
  const preview = useStudentOptions(open && form.fromSectionId ? form.fromSectionId : null);

  const close = () => {
    setForm(emptyForm);
    setResult(null);
    onClose();
  };

  const promote = useApiMutation((f: typeof emptyForm) => api.post<PromoteResult>("students/promote", f), {
    invalidate: [["students"], ["dashboard"], ["academic-years"]],
    success: (r) => `Promoted ${r.promoted} student(s)`,
    onSuccess: setResult,
  });

  const currentYear = years.data?.find((y) => y.isCurrent);
  const targetYears = (years.data ?? []).filter((y) => !y.isCurrent);
  const sectionOptions = (sections.data ?? []).map((s) => ({ value: s.id, label: s.label }));
  const ready = form.fromSectionId && form.toAcademicYearId && form.toSectionId;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Promote Students"
      description="Enrol a whole section into a class of the next academic year. Students already enrolled in that year are skipped."
      onSubmit={result ? close : () => ready && promote.mutate(form)}
      footer={
        result ? (
          <Button type="submit">Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={promote.isPending} disabled={!ready || targetYears.length === 0}>
              Promote
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <p className="text-sm text-gray-700">
            <span className="font-bold">{result.promoted}</span> student(s) promoted to{" "}
            <span className="font-bold">{result.toSectionLabel}</span> for {result.toAcademicYear}.
          </p>
          {result.skipped > 0 && (
            <p className="text-xs text-gray-500">{result.skipped} skipped (already enrolled in that year).</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Field
            label={`From class & section${currentYear ? ` (${currentYear.name})` : ""}`}
            required
            hint={
              form.fromSectionId && preview.data
                ? `${preview.data.length} active student(s) in this section`
                : undefined
            }
          >
            <Select
              required
              value={form.fromSectionId}
              onChange={(e) => setForm({ ...form, fromSectionId: e.target.value })}
              options={sectionOptions}
              placeholder="Select section"
            />
          </Field>
          <Field
            label="To academic year"
            required
            error={!years.isLoading && targetYears.length === 0 ? "Create the next academic year in Academic Setup first" : undefined}
          >
            <Select
              required
              value={form.toAcademicYearId}
              onChange={(e) => setForm({ ...form, toAcademicYearId: e.target.value })}
              options={targetYears.map((y) => ({ value: y.id, label: y.name }))}
              placeholder="Select year"
            />
          </Field>
          <Field label="To class & section" required>
            <Select
              required
              value={form.toSectionId}
              onChange={(e) => setForm({ ...form, toSectionId: e.target.value })}
              options={sectionOptions}
              placeholder="Select section"
            />
          </Field>
        </div>
      )}
    </Modal>
  );
};

export default PromoteModal;
