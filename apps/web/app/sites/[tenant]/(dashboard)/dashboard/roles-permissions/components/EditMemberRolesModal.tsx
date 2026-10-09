"use client";

import { useState } from "react";
import { Badge, Button, Checkbox, Modal } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { ADMIN_ROLE_CODE, type MemberRecord, type RoleRecord } from "./types";

interface Props {
  member: MemberRecord | null;
  roles: RoleRecord[];
  isSelf: boolean;
  onClose: () => void;
}

// Keyed by membership so the selection resets for every user opened.
const EditMemberRolesModal = ({ member, ...rest }: Props) =>
  member ? <EditMemberRolesForm key={member.membershipId} member={member} {...rest} /> : null;

const EditMemberRolesForm = ({ member, roles, isSelf, onClose }: Props & { member: MemberRecord }) => {
  const [selected, setSelected] = useState<string[]>(member.roles.map((r) => r.code));
  const selfAdmin = isSelf && member.roles.some((r) => r.code === ADMIN_ROLE_CODE);

  const save = useApiMutation(
    (roleCodes: string[]) => api.put(`members/${member.membershipId}/roles`, { roleCodes }),
    { invalidate: [["roles"]], success: `Roles updated for ${member.name}`, onSuccess: onClose },
  );

  const toggle = (code: string, on: boolean) =>
    setSelected((prev) => (on ? [...new Set([...prev, code])] : prev.filter((c) => c !== code)));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit roles — ${member.name}`}
      description={member.email}
      size="md"
      onSubmit={() => selected.length && save.mutate(selected)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!selected.length}>
            Save roles
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {roles.map((role) => {
          const lockAdmin = selfAdmin && role.code === ADMIN_ROLE_CODE;
          return (
            <div
              key={role.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
            >
              <Checkbox
                checked={selected.includes(role.code)}
                disabled={lockAdmin || save.isPending}
                onChange={(on) => toggle(role.code, on)}
                label={
                  <span>
                    <span className="font-semibold text-gray-900">{role.name}</span>
                    {lockAdmin && (
                      <span className="ml-2 text-[11px] text-gray-400">You cannot remove your own admin role</span>
                    )}
                  </span>
                }
              />
              <Badge tone={role.isSystem ? "gray" : "blue"} className="px-2 py-0.5 text-[10px]">
                {role.isSystem ? "System" : "Custom"}
              </Badge>
            </div>
          );
        })}
        {!selected.length && <p className="text-xs text-red-600">Select at least one role.</p>}
      </div>
    </Modal>
  );
};

export default EditMemberRolesModal;
