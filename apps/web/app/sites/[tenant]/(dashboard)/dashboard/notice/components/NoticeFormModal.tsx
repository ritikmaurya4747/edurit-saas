"use client";

import { useRef, useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import {
  AUDIENCE_OPTIONS,
  PRIORITY_OPTIONS,
  type NoticeForm,
  type NoticePriority,
  type NoticeStatus,
  type NoticeTarget,
} from "./types";

export const NOTICE_KEYS = [["notices"], ["dashboard"]];

interface Props {
  initial: NoticeForm;
  onClose: () => void;
}

// Create / edit a notice. New notices and drafts can be saved as a draft or
// published; already published or archived notices are simply saved.
const NoticeFormModal = ({ initial, onClose }: Props) => {
  const [form, setForm] = useState<NoticeForm>(initial);
  // The clicked footer button sets the intent before the form submits.
  const intent = useRef<NoticeStatus | undefined>(undefined);
  const [submitted, setSubmitted] = useState<NoticeStatus | undefined>(undefined);
  const isEdit = !!initial.id;
  const canChooseStatus = !isEdit || initial.status === "DRAFT";

  const save = useApiMutation(
    ({ id, ...body }: NoticeForm) =>
      id ? api.patch<{ status: NoticeStatus }>(`notices/${id}`, body) : api.post<{ status: NoticeStatus }>("notices", body),
    {
      invalidate: NOTICE_KEYS,
      success: (n: { status: NoticeStatus }) =>
        n.status === "DRAFT" ? "Draft saved" : n.status === "PUBLISHED" && initial.status !== "PUBLISHED" ? "Notice published" : "Notice saved",
      onSuccess: onClose,
    },
  );

  const submit = () => {
    setSubmitted(intent.current);
    const body: NoticeForm = {
      id: form.id,
      title: form.title.trim(),
      content: form.content.trim(),
      targetRole: form.targetRole,
      priority: form.priority,
      ...(canChooseStatus && intent.current ? { status: intent.current } : {}),
    };
    save.mutate(body);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Notice" : "Create New Notice"}
      description="Draft an announcement to be broadcast to the selected audience."
      size="lg"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          {canChooseStatus ? (
            <>
              <Button
                type="submit"
                variant="outline"
                loading={save.isPending && submitted === "DRAFT"}
                disabled={save.isPending}
                onClick={() => (intent.current = "DRAFT")}
              >
                Save as draft
              </Button>
              <Button
                type="submit"
                loading={save.isPending && submitted === "PUBLISHED"}
                disabled={save.isPending}
                onClick={() => (intent.current = "PUBLISHED")}
              >
                Publish notice
              </Button>
            </>
          ) : (
            <Button type="submit" loading={save.isPending} onClick={() => (intent.current = undefined)}>
              Save changes
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Notice title" required>
          <Input
            required
            maxLength={255}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Holiday on Monday"
            autoFocus
          />
        </Field>
        <Field label="Content / description" required>
          <Textarea
            required
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Enter the full details here…"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Target audience" required>
            <Select
              value={form.targetRole}
              options={AUDIENCE_OPTIONS}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value as NoticeTarget })}
            />
          </Field>
          <Field label="Priority" required>
            <Select
              value={form.priority}
              options={PRIORITY_OPTIONS}
              onChange={(e) => setForm({ ...form, priority: e.target.value as NoticePriority })}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

export default NoticeFormModal;
