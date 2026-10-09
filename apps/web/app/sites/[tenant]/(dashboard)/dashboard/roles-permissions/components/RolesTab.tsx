"use client";

import { useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Lock, RotateCcw, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { ADMIN_ROLE_CODE, ROLES_KEYS, type PermissionGroup, type RoleRecord } from "./types";

interface Props {
  roles: UseQueryResult<RoleRecord[], Error>;
  selectedRoleId: string | null;
  onSelectRole: (id: string | null) => void;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const RolesTab = ({ roles, selectedRoleId, onSelectRole }: Props) => {
  const permissions = useApiQuery<PermissionGroup[]>([...ROLES_KEYS.permissions], "permissions", undefined, {
    staleTime: 10 * 60_000,
  });
  // Unsaved edits per role id (kept while switching between roles).
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<RoleRecord | null>(null);

  const roleList = useMemo(() => roles.data ?? [], [roles.data]);
  const activeRole = roleList.find((r) => r.id === selectedRoleId) ?? roleList[0];
  const allCodes = useMemo(
    () => (permissions.data ?? []).flatMap((g) => g.permissions.map((p) => p.code)),
    [permissions.data],
  );

  const isAdminRole = activeRole?.code === ADMIN_ROLE_CODE;
  const draft = activeRole ? drafts[activeRole.id] : undefined;
  const checked = isAdminRole ? allCodes : (draft ?? activeRole?.permissionCodes ?? []);
  const dirty = !!activeRole && !!draft && !sameSet(draft, activeRole.permissionCodes);

  const clearDraft = (roleId: string) =>
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });

  const save = useApiMutation(
    (vars: { id: string; permissionCodes: string[] }) =>
      api.patch<RoleRecord>(`roles/${vars.id}`, { permissionCodes: vars.permissionCodes }),
    {
      invalidate: [["roles"]],
      success: (role) => `Permissions saved for ${role?.name ?? "role"}`,
      onSuccess: (role) => role?.id && clearDraft(role.id),
    },
  );

  const remove = useApiMutation((id: string) => api.delete(`roles/${id}`), {
    invalidate: [["roles"]],
    success: "Role deleted",
    onSuccess: () => {
      if (toDelete) clearDraft(toDelete.id);
      setToDelete(null);
      onSelectRole(null);
    },
  });

  const setCodes = (codes: string[]) => {
    if (!activeRole || isAdminRole) return;
    setDrafts((prev) => ({ ...prev, [activeRole.id]: codes }));
  };

  const toggle = (code: string) =>
    setCodes(checked.includes(code) ? checked.filter((c) => c !== code) : [...checked, code]);

  const toggleModule = (group: PermissionGroup, select: boolean) => {
    const codes = group.permissions.map((p) => p.code);
    setCodes(select ? [...new Set([...checked, ...codes])] : checked.filter((c) => !codes.includes(c)));
  };

  if (roles.isLoading) return <LoadingState label="Loading roles…" />;
  if (roles.error) return <ErrorState message={roles.error.message} onRetry={() => roles.refetch()} />;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:h-[calc(100vh-15rem)] lg:min-h-125 lg:grid-cols-3">
        {/* Left column: roles list */}
        <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:max-h-none">
          <div className="shrink-0 border-b border-gray-100 bg-gray-50/80 px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Available Roles</h3>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/30 p-4">
            {roleList.map((role) => {
              const selected = activeRole?.id === role.id;
              const roleDraft = drafts[role.id];
              const hasDraft = !!roleDraft && !sameSet(roleDraft, role.permissionCodes);
              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => onSelectRole(role.id)}
                  className={`block w-full cursor-pointer rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-[#1C263A] bg-[#1C263A] shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-bold ${selected ? "text-white" : "text-gray-900"}`}>
                      {role.name}
                      {hasDraft && <span className="ml-1.5 text-amber-400" title="Unsaved changes">•</span>}
                    </h4>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                        role.isSystem
                          ? selected
                            ? "border-white/30 bg-white/20 text-white"
                            : "border-gray-200 bg-gray-100 text-gray-600"
                          : selected
                            ? "border-blue-400/30 bg-blue-500/20 text-blue-100"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {role.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${selected ? "text-gray-300" : "text-gray-500"}`}>
                    {role.memberCount} {role.memberCount === 1 ? "user" : "users"} assigned ·{" "}
                    {role.code === ADMIN_ROLE_CODE ? "full access" : `${role.permissionCodes.length} permissions`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: permission matrix */}
        <div className="flex min-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          {activeRole ? (
            <>
              <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">
                    {activeRole.name} Permissions
                    <span className="ml-2 font-mono text-[10px] font-semibold text-gray-400">{activeRole.code}</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {isAdminRole
                      ? "Administrators always have every permission."
                      : `${checked.length} of ${allCodes.length} permissions selected.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!activeRole.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setToDelete(activeRole)}
                      disabled={activeRole.memberCount > 0}
                      title={activeRole.memberCount > 0 ? "Reassign its users before deleting this role" : undefined}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete role
                    </Button>
                  )}
                  {dirty && (
                    <Button variant="secondary" size="sm" onClick={() => clearDraft(activeRole.id)} disabled={save.isPending}>
                      <RotateCcw className="h-3.5 w-3.5" /> Discard
                    </Button>
                  )}
                  {!isAdminRole && (
                    <Button
                      variant="success"
                      size="sm"
                      disabled={!dirty}
                      loading={save.isPending}
                      onClick={() => save.mutate({ id: activeRole.id, permissionCodes: checked })}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                {isAdminRole && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      The School Administrator role is a protected super-role. It always has full access and its
                      permissions cannot be changed. Create a custom role for limited administrative access.
                    </span>
                  </div>
                )}

                {permissions.isLoading && <LoadingState label="Loading permissions…" />}
                {permissions.error && (
                  <ErrorState message={permissions.error.message} onRetry={() => permissions.refetch()} />
                )}

                {(permissions.data ?? []).map((group) => {
                  const selectedInModule = group.permissions.filter((p) => checked.includes(p.code)).length;
                  const allSelected = selectedInModule === group.permissions.length;
                  return (
                    <div key={group.module} className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                        <h4 className="text-sm font-bold text-gray-800">
                          {group.module}
                          <span className="ml-2 text-[10px] font-semibold text-gray-400">
                            {selectedInModule}/{group.permissions.length}
                          </span>
                        </h4>
                        <label
                          className={`inline-flex items-center gap-2 text-xs font-semibold text-gray-600 ${
                            isAdminRole ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-[#1C263A]"
                            checked={allSelected}
                            disabled={isAdminRole}
                            onChange={(e) => toggleModule(group, e.target.checked)}
                          />
                          Select all
                        </label>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {group.permissions.map((perm) => {
                          const isChecked = checked.includes(perm.code);
                          return (
                            <label
                              key={perm.code}
                              className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 ${
                                isAdminRole ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                              }`}
                            >
                              <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-semibold text-gray-900">{perm.description || perm.code}</span>
                                <span className="mt-0.5 font-mono text-[10px] text-gray-400">{perm.code}</span>
                              </div>

                              <div
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                  isChecked ? "bg-[#1C263A]" : "bg-gray-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isChecked ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </div>

                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isChecked}
                                disabled={isAdminRole}
                                onChange={() => toggle(perm.code)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-400">
              No roles yet. Create a custom role to get started.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.name}?`}
        message="This custom role and its permission set will be removed permanently."
        confirmLabel="Delete role"
      />
    </>
  );
};

export default RolesTab;
