"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { PORTAL_KEY } from "../../hooks";
import type { LeaveRequest, PortalChild } from "../../types";

// Parent → apply for leave for the selected child. Mounted only while open,
// so the form starts fresh every time.
export default function LeaveModal({
  open,
  onClose,
  student,
  today,
}: {
  open: boolean;
  onClose: () => void;
  student: PortalChild;
  today: string;
}) {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = useApiMutation(
    () =>
      api.post<LeaveRequest>(`portal/students/${student.id}/leaves`, {
        startDate,
        endDate,
        reason: reason.trim(),
      }),
    { invalidate: [[PORTAL_KEY]], success: "Leave request sent to the school", onSuccess: onClose },
  );

  const submit = () => {
    if (!startDate || !endDate) return setError("Please choose the leave dates");
    if (endDate < startDate) return setError("End date must be on or after the start date");
    if (!reason.trim()) return setError("Please give a reason for the leave");
    setError(null);
    apply.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for leave"
      description={`For ${student.name}${student.sectionLabel ? ` · ${student.sectionLabel}` : ""}`}
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={apply.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={apply.isPending}>
            Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From" required>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </Field>
          <Field label="To" required>
            <Input type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Reason" required hint="The class teacher will see this when approving the request.">
          <Textarea
            required
            rows={4}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Fever — doctor advised two days of rest"
          />
        </Field>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
