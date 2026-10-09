"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Button, ConfirmDialog, Field, Input, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { ACADEMIC_KEYS, useSubjects } from "@/lib/api/lookups";
import type { Subject } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";

const SubjectsTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.SUBJECT_MANAGE);
  const subjects = useSubjects();
  const [form, setForm] = useState<{ id?: string; name: string; code: string } | null>(null);
  const [toDelete, setToDelete] = useState<Subject | null>(null);

  const save = useApiMutation(
    (f: NonNullable<typeof form>) =>
      f.id ? api.patch(`subjects/${f.id}`, { name: f.name, code: f.code }) : api.post("subjects", { name: f.name, code: f.code }),
    { invalidate: ACADEMIC_KEYS, success: "Subject saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`subjects/${id}`), {
    invalidate: ACADEMIC_KEYS,
    success: "Subject deleted",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<Subject>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="text-xs font-bold uppercase text-gray-500">{row.original.code}</span> },
      { accessorKey: "name", header: "Subject", cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.name}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setForm({ ...row.original })}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setToDelete(row.original)}>
                Delete
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManage],
  );

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setForm({ name: "", code: "" })}>
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>
      )}
      <QueryState isLoading={subjects.isLoading} error={subjects.error} onRetry={() => subjects.refetch()}>
        <DataTable columns={columns} data={subjects.data ?? []} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Subject" : "Add Subject"}
        size="sm"
        onSubmit={() => form && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subject name" required className="col-span-2">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" />
            </Field>
            <Field label="Code" required>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MATH" />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="Existing marks and homework for this subject are kept for records."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default SubjectsTab;
