"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { ACADEMIC_KEYS, useBranches, useClasses } from "@/lib/api/lookups";
import type { ClassItem, SectionSummary } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";

const emptyClass = { name: "", code: "", branchId: "", sections: "A", sectionCapacity: "40" };

const ClassesTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.CLASS_MANAGE);
  const classes = useClasses();
  const branches = useBranches();

  const [classForm, setClassForm] = useState<typeof emptyClass | null>(null);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [sectionForm, setSectionForm] = useState<{ classId: string; section?: SectionSummary; name: string; capacity: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ kind: "class" | "section"; id: string; name: string } | null>(null);

  const saveClass = useApiMutation(
    (form: typeof emptyClass) => {
      const sections = form.sections.split(",").map((s) => s.trim()).filter(Boolean);
      return editing
        ? api.patch(`classes/${editing.id}`, { name: form.name, code: form.code })
        : api.post("classes", {
            name: form.name,
            code: form.code,
            branchId: form.branchId || undefined,
            sections,
            sectionCapacity: Number(form.sectionCapacity) || 40,
          });
    },
    {
      invalidate: ACADEMIC_KEYS,
      success: editing ? "Class updated" : "Class created",
      onSuccess: () => {
        setClassForm(null);
        setEditing(null);
      },
    },
  );

  const saveSection = useApiMutation(
    (form: NonNullable<typeof sectionForm>) => {
      const body = { name: form.name, capacity: Number(form.capacity) || 40 };
      return form.section ? api.patch(`sections/${form.section.id}`, body) : api.post(`classes/${form.classId}/sections`, body);
    },
    { invalidate: ACADEMIC_KEYS, success: "Section saved", onSuccess: () => setSectionForm(null) },
  );

  const remove = useApiMutation(
    (target: NonNullable<typeof toDelete>) => api.delete(target.kind === "class" ? `classes/${target.id}` : `sections/${target.id}`),
    { invalidate: ACADEMIC_KEYS, success: "Deleted", onSuccess: () => setToDelete(null) },
  );

  const openCreate = () => {
    setEditing(null);
    setClassForm({ ...emptyClass, branchId: branches.data?.[0]?.id ?? "" });
  };

  const openEdit = (cls: ClassItem) => {
    setEditing(cls);
    setClassForm({ ...emptyClass, name: cls.name, code: cls.code, branchId: cls.branchId });
  };

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Class
          </Button>
        </div>
      )}

      <QueryState
        isLoading={classes.isLoading}
        error={classes.error}
        onRetry={() => classes.refetch()}
        isEmpty={!classes.data?.length}
        empty={
          <EmptyState
            title="No classes yet"
            description="Create classes like Nursery, Class 1 … Class 12 and their sections."
            action={canManage && <Button onClick={openCreate}>Add first class</Button>}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.data?.map((cls) => (
            <Card key={cls.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{cls.name}</h3>
                  <p className="text-xs text-gray-500">
                    {cls.code} · {cls.branch?.name} · {cls.studentCount} students
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cls)} aria-label="Edit class">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete({ kind: "class", id: cls.id, name: cls.name })}
                      aria-label="Delete class"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {cls.sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() =>
                      setSectionForm({ classId: cls.id, section, name: section.name, capacity: String(section.capacity) })
                    }
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs enabled:cursor-pointer enabled:hover:border-gray-300"
                  >
                    <span className="font-bold text-gray-800">Section {section.name}</span>
                    <span className="ml-2 text-gray-500">
                      {section.studentCount}/{section.capacity}
                    </span>
                  </button>
                ))}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setSectionForm({ classId: cls.id, name: "", capacity: "40" })}
                    className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-50"
                  >
                    + Section
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      <Modal
        open={!!classForm}
        onClose={() => setClassForm(null)}
        title={editing ? `Edit ${editing.name}` : "Add Class"}
        onSubmit={() => classForm && saveClass.mutate(classForm)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setClassForm(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveClass.isPending}>
              Save
            </Button>
          </>
        }
      >
        {classForm && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Class name" required className="col-span-2 sm:col-span-1">
              <Input
                required
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="Class 8"
              />
            </Field>
            <Field label="Code" required className="col-span-2 sm:col-span-1">
              <Input
                required
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                placeholder="C8"
              />
            </Field>
            {!editing && (
              <>
                <Field label="Branch" className="col-span-2">
                  <Select
                    value={classForm.branchId}
                    onChange={(e) => setClassForm({ ...classForm, branchId: e.target.value })}
                    options={(branches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
                  />
                </Field>
                <Field label="Sections" hint="Comma separated, e.g. A, B, C" className="col-span-2 sm:col-span-1">
                  <Input
                    value={classForm.sections}
                    onChange={(e) => setClassForm({ ...classForm, sections: e.target.value })}
                  />
                </Field>
                <Field label="Capacity per section" className="col-span-2 sm:col-span-1">
                  <Input
                    type="number"
                    min={1}
                    value={classForm.sectionCapacity}
                    onChange={(e) => setClassForm({ ...classForm, sectionCapacity: e.target.value })}
                  />
                </Field>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!sectionForm}
        onClose={() => setSectionForm(null)}
        title={sectionForm?.section ? `Edit Section ${sectionForm.section.name}` : "Add Section"}
        size="sm"
        onSubmit={() => sectionForm && saveSection.mutate(sectionForm)}
        footer={
          <>
            {sectionForm?.section && (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  setToDelete({ kind: "section", id: sectionForm.section!.id, name: `Section ${sectionForm.section!.name}` });
                  setSectionForm(null);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSectionForm(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveSection.isPending}>
              Save
            </Button>
          </>
        }
      >
        {sectionForm && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Section name" required>
              <Input required value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="C" />
            </Field>
            <Field label="Capacity">
              <Input
                type="number"
                min={1}
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="This is only allowed when no students are enrolled in the current academic year."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default ClassesTab;
