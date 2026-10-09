"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { toRoleCode, type RoleRecord } from "./types";

interface Props {
  open: boolean;
  roles: RoleRecord[];
  onClose: () => void;
  onCreated: (role: RoleRecord | undefined) => void;
}

const empty = { name: "", code: "", copyFrom: "" };

const CreateRoleModal = ({ open, roles, onClose, onCreated }: Props) => {
  const [form, setForm] = useState(empty);

  const close = () => {
    setForm(empty);
    onClose();
  };

  const create = useApiMutation(
    (f: typeof empty) =>
      api.post<RoleRecord>("roles", {
        name: f.name.trim(),
        code: f.code.trim() ? toRoleCode(f.code) : undefined,
        permissionCodes: roles.find((r) => r.id === f.copyFrom)?.permissionCodes ?? [],
      }),
    {
      invalidate: [["roles"]],
      success: (role) => `Role '${role?.name ?? form.name}' created`,
      onSuccess: (role) => {
        setForm(empty);
        onCreated(role);
      },
    },
  );

  const derivedCode = toRoleCode(form.code || form.name);
  const source = roles.find((r) => r.id === form.copyFrom);

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create Custom Role"
      description="Create a role for a specific job, then fine-tune its permissions in the matrix."
      size="sm"
      onSubmit={() => form.name.trim() && create.mutate(form)}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={!form.name.trim()}>
            Create Role
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Role title" required>
          <Input
            required
            autoFocus
            maxLength={64}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Librarian, Transport Head"
          />
        </Field>
        <Field label="Role code" hint={derivedCode ? `Saved as ${derivedCode}` : "Derived from the title when left blank"}>
          <Input
            maxLength={64}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder={derivedCode || "LIBRARIAN"}
          />
        </Field>
        <Field
          label="Copy permissions from"
          hint={source ? `${source.permissionCodes.length} permissions will be copied` : "The role starts with no permissions"}
        >
          <Select
            value={form.copyFrom}
            onChange={(e) => setForm({ ...form, copyFrom: e.target.value })}
            placeholder="Start empty"
            options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.permissionCodes.length})` }))}
          />
        </Field>
      </div>
    </Modal>
  );
};

export default CreateRoleModal;
