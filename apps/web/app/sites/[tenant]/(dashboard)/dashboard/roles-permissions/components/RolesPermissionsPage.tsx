"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import CreateRoleModal from "./CreateRoleModal";
import MembersTab from "./MembersTab";
import RolesTab from "./RolesTab";
import { ROLES_KEYS, type RoleRecord } from "./types";

type TabId = "roles" | "members";

const RolesPermissionsPage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.ROLES_MANAGE);
  const [tab, setTab] = useState<TabId>("roles");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const roles = useApiQuery<RoleRecord[]>([...ROLES_KEYS.roles], canManage ? "roles" : null);

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Roles & Permissions" />
        <EmptyState
          title="You don't have access to this page"
          description="Ask your school administrator for the 'Manage roles, permissions and user access' permission."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Roles & Permissions"
        description="Configure access levels and security permissions for your school staff"
        actions={
          tab === "roles" ? (
            <Button onClick={() => setCreateOpen(true)} disabled={!roles.data}>
              <Plus className="h-4 w-4" /> Create Custom Role
            </Button>
          ) : undefined
        }
      />

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "roles", label: "Roles", count: roles.data?.length },
          { id: "members", label: "Users & Access" },
        ]}
      />

      {tab === "roles" && (
        <RolesTab roles={roles} selectedRoleId={selectedRoleId} onSelectRole={setSelectedRoleId} />
      )}
      {tab === "members" && <MembersTab roles={roles.data ?? []} />}

      <CreateRoleModal
        open={createOpen}
        roles={roles.data ?? []}
        onClose={() => setCreateOpen(false)}
        onCreated={(role) => {
          setCreateOpen(false);
          if (role?.id) setSelectedRoleId(role.id);
          setTab("roles");
        }}
      />
    </div>
  );
};

export default RolesPermissionsPage;
