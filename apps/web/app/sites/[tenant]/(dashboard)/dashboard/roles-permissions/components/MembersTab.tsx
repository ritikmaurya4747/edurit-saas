"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, ConfirmDialog, EmptyState, Pagination, QueryState, SearchInput, Select, type BadgeTone } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { humanize } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import EditMemberRolesModal from "./EditMemberRolesModal";
import { ADMIN_ROLE_CODE, ROLES_KEYS, type MemberRecord, type MemberStatus, type ProfileType, type RoleRecord } from "./types";

const statusTone: Record<MemberStatus, BadgeTone> = { ACTIVE: "green", SUSPENDED: "red", INVITED: "yellow" };
const profileTone: Record<ProfileType, BadgeTone> = { STAFF: "blue", PARENT: "purple", STUDENT: "orange", USER: "gray" };

const MembersTab = ({ roles }: { roles: RoleRecord[] }) => {
  const currentUser = useUser();
  const [search, setSearch] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const [editing, setEditing] = useState<MemberRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ member: MemberRecord; status: "ACTIVE" | "SUSPENDED" } | null>(null);

  const members = usePaginatedQuery<MemberRecord>([...ROLES_KEYS.members], "members", {
    page,
    limit: 20,
    search: debounced || undefined,
    roleCode: roleCode || undefined,
    status: status || undefined,
  });

  const changeStatus = useApiMutation(
    (vars: { membershipId: string; status: "ACTIVE" | "SUSPENDED" }) =>
      api.post(`members/${vars.membershipId}/status`, { status: vars.status }),
    {
      invalidate: [["roles"]],
      success: () => (statusTarget?.status === "SUSPENDED" ? "User suspended" : "User activated"),
      onSuccess: () => setStatusTarget(null),
    },
  );

  const columns = useMemo<ColumnDef<MemberRecord>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const m = row.original;
          const isSelf = m.userId === currentUser?.id;
          return (
            <div className="min-w-44">
              <p className="text-sm font-bold text-gray-900">
                {m.name || "—"}
                {isSelf && <span className="ml-1.5 text-[10px] font-semibold text-gray-400">(you)</span>}
              </p>
              <p className="text-xs text-gray-500">{m.email}</p>
            </div>
          );
        },
      },
      {
        id: "profile",
        header: "Profile",
        cell: ({ row }) => <Badge tone={profileTone[row.original.profileType]}>{humanize(row.original.profileType)}</Badge>,
      },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex min-w-40 flex-wrap gap-1">
            {row.original.roles.length ? (
              row.original.roles.map((r) => (
                <Badge key={r.code} tone={r.code === ADMIN_ROLE_CODE ? "purple" : "gray"} className="px-2 py-0.5 text-[11px]">
                  {r.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">No role</span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={statusTone[row.original.status]}>{humanize(row.original.status)}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const m = row.original;
          const isSelf = m.userId === currentUser?.id;
          return (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>
                Edit roles
              </Button>
              {m.status === "SUSPENDED" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700"
                  onClick={() => setStatusTarget({ member: m, status: "ACTIVE" })}
                >
                  Activate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  disabled={isSelf}
                  title={isSelf ? "You cannot suspend your own account" : undefined}
                  onClick={() => setStatusTarget({ member: m, status: "SUSPENDED" })}
                >
                  Suspend
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUser?.id],
  );

  const filtersActive = !!(debounced || roleCode || status);

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_180px]">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, email or phone…"
        />
        <Select
          value={roleCode}
          onChange={(e) => {
            setRoleCode(e.target.value);
            setPage(1);
          }}
          placeholder="All roles"
          options={roles.map((r) => ({ value: r.code, label: r.name }))}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          placeholder="All statuses"
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "SUSPENDED", label: "Suspended" },
            { value: "INVITED", label: "Invited" },
          ]}
        />
      </div>

      <QueryState
        isLoading={members.isLoading}
        error={members.error}
        onRetry={() => members.refetch()}
        isEmpty={!members.data?.data.length}
        empty={
          <EmptyState
            title={filtersActive ? "No users match these filters" : "No users yet"}
            description={
              filtersActive
                ? "Try a different name, role or status."
                : "Users appear here when you add staff, admit students or invite parents."
            }
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setRoleCode("");
                    setStatus("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={members.data?.data ?? []} />
        <Pagination meta={members.data?.meta} onPageChange={setPage} />
      </QueryState>

      <EditMemberRolesModal
        member={editing}
        roles={roles}
        isSelf={!!editing && editing.userId === currentUser?.id}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget && changeStatus.mutate({ membershipId: statusTarget.member.membershipId, status: statusTarget.status })
        }
        loading={changeStatus.isPending}
        tone={statusTarget?.status === "SUSPENDED" ? "danger" : "primary"}
        title={statusTarget?.status === "SUSPENDED" ? `Suspend ${statusTarget?.member.name}?` : `Activate ${statusTarget?.member.name}?`}
        message={
          statusTarget?.status === "SUSPENDED"
            ? "They will be signed out and will not be able to access this school until re-activated. Their records are kept."
            : "They will be able to sign in to this school again with their existing roles."
        }
        confirmLabel={statusTarget?.status === "SUSPENDED" ? "Suspend" : "Activate"}
      />
    </div>
  );
};

export default MembersTab;
