"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Button, ConfirmDialog, Field, Input, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { ACADEMIC_KEYS, useBranches } from "@/lib/api/lookups";
import type { Branch } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";

type BranchForm = { id?: string; name: string; code: string; line1: string; city: string; state: string; pincode: string };

const emptyForm: BranchForm = { name: "", code: "", line1: "", city: "", state: "", pincode: "" };

const BranchesTab = () => {
  const can = useCan();
  const branches = useBranches();
  const [form, setForm] = useState<BranchForm | null>(null);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const save = useApiMutation(
    ({ id, name, code, ...address }: BranchForm) => {
      const body = { name, code, address };
      return id ? api.patch(`branches/${id}`, body) : api.post("branches", body);
    },
    { invalidate: ACADEMIC_KEYS, success: "Branch saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`branches/${id}`), {
    invalidate: ACADEMIC_KEYS,
    success: "Branch deleted",
    onSuccess: () => setToDelete(null),
  });

  const canEdit = can(PERMISSIONS.BRANCH_UPDATE);
  const canDelete = can(PERMISSIONS.BRANCH_DELETE);

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="text-xs font-bold text-gray-500">{row.original.code}</span> },
      { accessorKey: "name", header: "Branch", cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.name}</span> },
      {
        id: "address",
        header: "Address",
        cell: ({ row }) => {
          const a = row.original.address ?? {};
          return <span className="text-gray-600">{[a.line1, a.city, a.state, a.pincode].filter(Boolean).join(", ") || "—"}</span>;
        },
      },
      {
        id: "counts",
        header: "Classes / Staff / Students",
        cell: ({ row }) => {
          const c = row.original._count;
          return `${c?.classes ?? 0} / ${c?.staff ?? 0} / ${c?.students ?? 0}`;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const a = row.original.address ?? {};
                  setForm({
                    id: row.original.id,
                    name: row.original.name,
                    code: row.original.code,
                    line1: a.line1 ?? "",
                    city: a.city ?? "",
                    state: a.state ?? "",
                    pincode: a.pincode ?? "",
                  });
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setToDelete(row.original)}>
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete],
  );

  return (
    <div>
      {can(PERMISSIONS.BRANCH_CREATE) && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setForm(emptyForm)}>
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </div>
      )}
      <QueryState isLoading={branches.isLoading} error={branches.error} onRetry={() => branches.refetch()}>
        <DataTable columns={columns} data={branches.data ?? []} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit Branch" : "Add Branch"}
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
            <Field label="Branch name" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="North Campus" />
            </Field>
            <Field label="Code" required>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="NORTH" />
            </Field>
            <Field label="Address" className="col-span-2">
              <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Street, area" />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="PIN code">
              <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
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
        message="Only empty branches (no classes, staff or students) can be deleted."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default BranchesTab;
