"use client";

import { useState } from "react";
import { Button, Checkbox, Field, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useAcademicYears, useSections } from "@/lib/api/lookups";
import { TIMETABLE_INVALIDATE, type CopyResult } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  toSection: { id: string; label: string };
  academicYearId: string;
}

// Copies another section's periods into the current one. Periods whose teacher
// is already busy in that slot are skipped by the API.
const CopyModal = ({ open, onClose, toSection, academicYearId }: Props) => {
  const sections = useSections();
  const years = useAcademicYears();
  const [fromSectionId, setFromSectionId] = useState("");
  const [fromYearId, setFromYearId] = useState(academicYearId);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const sameYear = fromYearId === academicYearId;
  const sectionOptions = (sections.data ?? [])
    .filter((s) => !sameYear || s.id !== toSection.id)
    .map((s) => ({ value: s.id, label: s.label }));

  const copy = useApiMutation(
    () =>
      api.post<CopyResult>("timetable/copy", {
        fromSectionId,
        toSectionId: toSection.id,
        academicYearId,
        fromAcademicYearId: fromYearId || undefined,
        replaceExisting,
      }),
    {
      invalidate: TIMETABLE_INVALIDATE,
      success: (r) => {
        const parts = [`Copied ${r.copied} period${r.copied === 1 ? "" : "s"}`];
        if (r.skippedClash) parts.push(`${r.skippedClash} skipped (teacher busy)`);
        if (r.skippedFilled) parts.push(`${r.skippedFilled} skipped (already filled)`);
        return parts.join(", ");
      },
      onSuccess: onClose,
    },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Copy timetable"
      description={`Copy periods into ${toSection.label}`}
      onSubmit={() => fromSectionId && copy.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={copy.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={copy.isPending} disabled={!fromSectionId}>
            Copy
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From academic year">
            <Select
              value={fromYearId}
              onChange={(e) => {
                setFromYearId(e.target.value);
                setFromSectionId("");
              }}
              options={(years.data ?? []).map((y) => ({ value: y.id, label: y.isCurrent ? `${y.name} (current)` : y.name }))}
            />
          </Field>
          <Field label="From section" required>
            <Select
              required
              value={fromSectionId}
              onChange={(e) => setFromSectionId(e.target.value)}
              placeholder="Select section"
              options={sectionOptions}
            />
          </Field>
        </div>
        <Checkbox
          label="Overwrite periods already filled in this section"
          checked={replaceExisting}
          onChange={setReplaceExisting}
        />
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          A teacher cannot be in two sections at once, so periods whose teacher is already busy in that slot are
          skipped. Within the same year that usually means most periods are skipped; copying last year&apos;s timetable
          of a section into the new year is where this helps most.
        </p>
      </div>
    </Modal>
  );
};

export default CopyModal;
