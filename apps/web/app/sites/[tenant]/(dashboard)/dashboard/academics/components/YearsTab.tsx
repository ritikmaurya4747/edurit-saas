"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, Checkbox, ConfirmDialog, Field, Input, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { ACADEMIC_KEYS, useAcademicYears } from "@/lib/api/lookups";
import type { AcademicYear } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, toDateInput } from "@/lib/utils/format";

type YearForm = { id?: string; name: string; startDate: string; endDate: string; isCurrent: boolean };

const YearsTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.ACADEMIC_YEAR_MANAGE);
  const years = useAcademicYears();
  const [form, setForm] = useState<YearForm | null>(null);
  const [toDelete, setToDelete] = useState<AcademicYear | null>(null);

  const save = useApiMutation(
    ({ id, ...body }: YearForm) => (id ? api.patch(`academic-years/${id}`, body) : api.post("academic-years", body)),
    { invalidate: ACADEMIC_KEYS, success: "Academic year saved", onSuccess: () => setForm(null) },
  );
  const setCurrent = useApiMutation((id: string) => api.post(`academic-years/${id}/set-current`), {
    invalidate: [...ACADEMIC_KEYS, ["dashboard"]],
    success: "Current academic year updated",
  });
  const remove = useApiMutation((id: string) => api.delete(`academic-years/${id}`), {
    invalidate: ACADEMIC_KEYS,
    success: "Academic year deleted",
    onSuccess: () => setToDelete(null),
  });

  const openCreate = () => {
    const y = new Date().getFullYear();
    setForm({ name: `${y}-${String(y + 1).slice(-2)}`, startDate: `${y}-04-01`, endDate: `${y + 1}-03-31`, isCurrent: false });
  };

  const columns = useMemo<ColumnDef<AcademicYear>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Session",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{row.original.name}</span>
            {row.original.isCurrent && <Badge tone="green">Current</Badge>}
          </div>
        ),
      },
      { accessorKey: "startDate", header: "Starts", cell: ({ row }) => formatDate(row.original.startDate) },
      { accessorKey: "endDate", header: "Ends", cell: ({ row }) => formatDate(row.original.endDate) },
      { id: "enrollments", header: "Enrollments", cell: ({ row }) => row.original._count?.enrollments ?? 0 },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage ? (
            <div className="flex justify-end gap-2">
              {!row.original.isCurrent && (
                <Button variant="outline" size="sm" loading={setCurrent.isPending} onClick={() => setCurrent.mutate(row.original.id)}>
                  Set current
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm({
                    id: row.original.id,
                    name: row.original.name,
                    startDate: toDateInput(row.original.startDate),
                    endDate: toDateInput(row.original.endDate),
                    isCurrent: row.original.isCurrent,
                  })
                }
              >
                Edit
              </Button>
              {!row.original.isCurrent && (
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setToDelete(row.original)}>
                  Delete
                </Button>
              )}
            </div>
          ) : null,
      },
    ],
    [canManage, setCurrent],
  );

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Academic Year
          </Button>
        </div>
      )}
      <QueryState isLoading={years.isLoading} error={years.error} onRetry={() => years.refetch()}>
        <DataTable columns={columns} data={years.data ?? []} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Academic Year" : "Add Academic Year"}
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Session name" required className="col-span-2">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2026-27" />
            </Field>
            <Field label="Start date" required>
              <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date" required>
              <Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Checkbox
                label="Make this the current academic year"
                checked={form.isCurrent}
                onChange={(isCurrent) => setForm({ ...form, isCurrent })}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="Only sessions without any student enrollments can be deleted."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default YearsTab;
