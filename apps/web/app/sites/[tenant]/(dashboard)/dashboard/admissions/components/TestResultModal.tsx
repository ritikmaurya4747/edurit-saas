"use client";

import { useState } from "react";
import { Button, Field, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { toDateTimeInput, type Enquiry } from "../types";

// Schedule the entrance test and/or record the score.
const TestResultModal = ({ enquiry, onClose }: { enquiry: Enquiry | null; onClose: () => void }) => (
  <Modal open={!!enquiry} onClose={onClose} title={enquiry ? `Entrance test · ${enquiry.studentName}` : "Entrance test"} size="sm">
    {enquiry && <TestForm key={enquiry.id} enquiry={enquiry} onClose={onClose} />}
  </Modal>
);

const TestForm = ({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) => {
  const [testDate, setTestDate] = useState(() => toDateTimeInput(enquiry.testDate));
  const [testScore, setTestScore] = useState(enquiry.testScore != null ? String(Number(enquiry.testScore)) : "");

  const save = useApiMutation(
    () =>
      api.patch(`admissions/${enquiry.id}`, {
        testDate: testDate ? new Date(testDate).toISOString() : null,
        testScore: testScore === "" ? null : Number(testScore),
      }),
    { invalidate: [["admissions"]], success: "Entrance test saved", onSuccess: onClose },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="grid grid-cols-1 gap-4">
        <Field label="Test date & time">
          <Input type="datetime-local" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
        </Field>
        <Field label="Score" hint="0 – 999.99, leave empty until the test is graded">
          <Input
            type="number"
            min={0}
            max={999.99}
            step="0.01"
            value={testScore}
            onChange={(e) => setTestScore(e.target.value)}
          />
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

export default TestResultModal;
