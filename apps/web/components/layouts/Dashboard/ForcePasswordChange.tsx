"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useUser } from "@/providers/user-provider";
import { tenantLogoutAction } from "@/app/sites/[tenant]/login/actions/tenant-auth";

// Shown over the whole dashboard when an admin issued a temporary password:
// the user must choose their own before using the ERP. Not dismissible.
export default function ForcePasswordChange() {
  const user = useUser();
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");

  const change = useApiMutation(
    (body: { currentPassword: string; newPassword: string }) => api.post("auth/change-password", body),
    { success: "Password updated. Welcome!", onSuccess: () => router.refresh() },
  );

  if (!user?.mustChangePassword) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (!/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      return setError("Use at least one letter and one number.");
    }
    if (form.newPassword !== form.confirm) return setError("The two new passwords do not match.");
    if (form.newPassword === form.currentPassword) return setError("Choose a password different from the temporary one.");
    change.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#16233F]/80 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" aria-label="Set a new password">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Set your own password</h2>
            <p className="text-xs text-gray-500">
              Hi {user.firstName || user.name}, you signed in with a temporary password. Please choose a new one to continue.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Temporary password" required>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </Field>
          <Field label="New password" required hint="At least 8 characters, with a letter and a number">
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => tenantLogoutAction()}
            className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
          <Button type="submit" loading={change.isPending}>
            Save & continue
          </Button>
        </div>
      </form>
    </div>
  );
}
