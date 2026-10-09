"use client";

import { useState } from "react";
import { KeyRound, UserRound, Users } from "lucide-react";
import { Badge, Button, Card, Checkbox, Field, Input, Modal, QueryState } from "@/components/ui";
import CredentialsSheet, { type IssuedCredential } from "@/components/credentials/CredentialsSheet";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { formatDateTime } from "@/lib/utils/format";

interface LoginStatus {
  student: {
    hasLogin: boolean;
    loginId: string;
    email: string | null;
    lastLoginAt: string | null;
    mustChangePassword: boolean;
    status: string | null;
  };
  guardians: {
    guardianId: string;
    relationship: string;
    isPrimary: boolean;
    name: string;
    phone: string | null;
    email: string | null;
    hasUsableLogin: boolean;
    loginId: string;
    lastLoginAt: string | null;
    mustChangePassword: boolean;
    status: string | null;
  }[];
}

type Target = { kind: "student" } | { kind: "guardian"; guardianId: string; name: string; email: string | null };

function LoginState({ has, lastLoginAt, mustChange, status }: { has: boolean; lastLoginAt: string | null; mustChange: boolean; status: string | null }) {
  if (status === "SUSPENDED") return <Badge tone="red">Suspended</Badge>;
  if (!has) return <Badge tone="gray">No login yet</Badge>;
  if (mustChange) return <Badge tone="yellow">Temporary password issued</Badge>;
  return <Badge tone="green">Active{lastLoginAt ? ` · last login ${formatDateTime(lastLoginAt)}` : ""}</Badge>;
}

export default function LoginsTab({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const status = useApiQuery<LoginStatus>(["students", studentId, "logins"], `students/${studentId}/login`);
  const [target, setTarget] = useState<Target | null>(null);
  const [form, setForm] = useState({ email: "", password: "", custom: false });
  const [issued, setIssued] = useState<IssuedCredential[] | null>(null);

  const issue = useApiMutation(
    (t: Target) => {
      const body = {
        email: form.email.trim() || undefined,
        password: form.custom && form.password ? form.password : undefined,
        resetExisting: true,
      };
      return t.kind === "student"
        ? api.post<IssuedCredential>(`students/${studentId}/login`, body)
        : api.post<IssuedCredential>(`students/${studentId}/guardians/${t.guardianId}/login`, body);
    },
    {
      invalidate: [["students", studentId, "logins"], ["students", studentId]],
      onSuccess: (credential) => {
        setTarget(null);
        setIssued([credential]);
      },
    },
  );

  const open = (t: Target) => {
    setForm({ email: t.kind === "guardian" ? t.email ?? "" : status.data?.student.email ?? "", password: "", custom: false });
    setTarget(t);
  };

  const data = status.data;

  return (
    <QueryState isLoading={status.isLoading} error={status.error} onRetry={() => status.refetch()}>
      {data && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Students sign in with their <b>admission number</b>; parents with their <b>mobile number</b> (or email). Everyone sets a
            new password at first login.
          </p>

          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Student login</p>
                <p className="text-xs text-gray-500">
                  Login ID: <span className="font-mono font-semibold text-gray-800">{data.student.loginId}</span>
                  {data.student.email && <> · {data.student.email}</>}
                </p>
                <div className="mt-1.5">
                  <LoginState
                    has={data.student.hasLogin}
                    lastLoginAt={data.student.lastLoginAt}
                    mustChange={data.student.mustChangePassword}
                    status={data.student.status}
                  />
                </div>
              </div>
            </div>
            {canManage && (
              <Button variant={data.student.hasLogin ? "secondary" : "primary"} size="sm" onClick={() => open({ kind: "student" })}>
                <KeyRound className="h-3.5 w-3.5" /> {data.student.hasLogin ? "Reset password" : "Create login"}
              </Button>
            )}
          </Card>

          {data.guardians.length === 0 ? (
            <Card className="p-4 text-sm text-gray-500">No guardians added yet — add one in the Guardians tab to give parent access.</Card>
          ) : (
            data.guardians.map((g) => (
              <Card key={g.guardianId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {g.name} <span className="font-normal text-gray-500">· {g.relationship}</span>
                      {g.isPrimary && <span className="ml-1 text-[10px] font-bold uppercase text-purple-600">Primary</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      Login ID: <span className="font-mono font-semibold text-gray-800">{g.loginId}</span>
                      {g.email && g.email !== g.loginId && <> · {g.email}</>}
                    </p>
                    <div className="mt-1.5">
                      <LoginState has={g.hasUsableLogin} lastLoginAt={g.lastLoginAt} mustChange={g.mustChangePassword} status={g.status} />
                    </div>
                  </div>
                </div>
                {canManage && (
                  <Button
                    variant={g.hasUsableLogin ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => open({ kind: "guardian", guardianId: g.guardianId, name: g.name, email: g.email })}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> {g.hasUsableLogin ? "Reset password" : "Give login"}
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        size="sm"
        title={target?.kind === "guardian" ? `Login for ${target.name}` : "Student login"}
        description="A temporary password is generated and shown once. The user must change it at first login."
        onSubmit={() => target && issue.mutate(target)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={issue.isPending}>
              Generate login
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Email (optional)"
            hint={target?.kind === "student" ? "The student can always use the admission number instead" : "Parents can always use their mobile number"}
          >
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@gmail.com" />
          </Field>
          <Checkbox label="Set the password myself" checked={form.custom} onChange={(custom) => setForm({ ...form, custom })} />
          {form.custom && (
            <Field label="Temporary password" required hint="Min 8 characters">
              <Input
                type="text"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          )}
        </div>
      </Modal>

      <CredentialsSheet open={!!issued} onClose={() => setIssued(null)} credentials={issued ?? []} title="Login created" />
    </QueryState>
  );
}
