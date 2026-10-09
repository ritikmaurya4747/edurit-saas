"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { getInitials } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 border-b border-gray-50 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const MyAccountTab = () => {
  const user = useUser();
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const tooShort = form.newPassword.length > 0 && form.newPassword.length < 8;
  const mismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;
  const sameAsOld = form.newPassword.length > 0 && form.newPassword === form.currentPassword;
  const valid =
    !!form.currentPassword && form.newPassword.length >= 8 && form.newPassword === form.confirmPassword && !sameAsOld;

  const change = useApiMutation(
    (f: typeof emptyForm) =>
      api.post("auth/change-password", { currentPassword: f.currentPassword, newPassword: f.newPassword }),
    {
      success: "Password changed",
      onSuccess: () => {
        setForm(emptyForm);
        setTouched(false);
      },
    },
  );

  const name = user?.name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C263A] text-sm font-bold text-white">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900">{name || "—"}</h3>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4">
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Phone" value={user?.phone || "—"} />
          <Row label="School" value={user?.tenantName ?? "—"} />
          <Row
            label="Roles"
            value={
              <span className="flex flex-wrap justify-end gap-1">
                {(user?.roles ?? []).length
                  ? user!.roles.map((r) => (
                      <Badge key={r.code} tone={r.code === "ADMIN" ? "purple" : "gray"} className="px-2 py-0.5 text-[11px]">
                        {r.name}
                      </Badge>
                    ))
                  : "—"}
              </span>
            }
          />
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          To change your name, email or phone, ask your school administrator to update your staff or user record.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900">Change password</h3>
        <p className="mt-0.5 text-xs text-gray-500">Use at least 8 characters. You&apos;ll stay signed in on this device.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (valid) change.mutate(form);
          }}
        >
          <Field label="Current password" required error={touched && !form.currentPassword ? "Enter your current password" : undefined}>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </Field>
          <Field
            label="New password"
            required
            error={tooShort ? "Must be at least 8 characters" : sameAsOld ? "Must differ from your current password" : undefined}
          >
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" required error={mismatch ? "Passwords do not match" : undefined}>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={change.isPending} disabled={!valid}>
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MyAccountTab;
