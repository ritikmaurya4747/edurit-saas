"use client";

import { Download, Printer, TriangleAlert } from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";
import { useUser } from "@/providers/user-provider";

// One issued login, as returned by the API (CredentialsService.IssuedCredential).
export interface IssuedCredential {
  userId?: string;
  role: "STUDENT" | "PARENT" | "STAFF" | "USER" | string;
  name: string;
  loginId: string;
  email?: string | null;
  temporaryPassword: string | null;
  existingAccount?: boolean;
  studentName?: string;
  classLabel?: string | null;
}

const roleTone = { STUDENT: "blue", PARENT: "purple", STAFF: "green" } as const;

const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Shows freshly issued logins ONCE: printable slips (cut & hand out) and a CSV.
// Temporary passwords are never stored by the server, so they cannot be shown
// again after this dialog is closed.
export default function CredentialsSheet({
  open,
  onClose,
  title = "Login credentials",
  credentials,
  skipped = [],
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  credentials: IssuedCredential[];
  skipped?: { name: string; role: string; reason: string }[];
}) {
  const user = useUser();
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const downloadCsv = () => {
    const header = ["Name", "Role", "Student", "Class", "Login ID", "Email", "Temporary password", "Note"];
    const rows = credentials.map((c) => [
      c.name,
      c.role,
      c.studentName ?? "",
      c.classLabel ?? "",
      c.loginId,
      c.email ?? "",
      c.temporaryPassword ?? "",
      c.existingAccount ? "Existing account - use current password" : "Change password at first login",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `login-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={title}
      description={`${credentials.length} login(s). Passwords are shown only now — print or download before closing.`}
      footer={
        <>
          <Button variant="secondary" onClick={downloadCsv} disabled={!credentials.length}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={!credentials.length}>
            <Printer className="h-4 w-4" /> Print slips
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #credentials-print, #credentials-print * { visibility: visible !important; }
          #credentials-print { position: absolute; inset: 0; padding: 8mm; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 print:hidden">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Everyone must set a new password at first login. Students sign in with their <b>admission number</b>, parents
          with their <b>mobile number</b> (or email).
        </span>
      </div>

      {skipped.length > 0 && (
        <details className="mb-4 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 print:hidden">
          <summary className="cursor-pointer font-semibold">{skipped.length} skipped</summary>
          <ul className="mt-2 space-y-1">
            {skipped.map((s, i) => (
              <li key={i}>
                <b>{s.name}</b> ({s.role}) — {s.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Printable slips: 2 per row on A4 */}
      <div id="credentials-print" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {credentials.map((c, i) => (
          <div
            key={`${c.userId ?? c.loginId}-${i}`}
            className="break-inside-avoid rounded-lg border border-dashed border-gray-400 p-3 text-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{user?.tenantName}</p>
                <p className="font-bold text-gray-900">{c.name}</p>
                {(c.studentName || c.classLabel) && c.role !== "STUDENT" && (
                  <p className="text-xs text-gray-500">
                    {c.studentName}
                    {c.classLabel ? ` · ${c.classLabel}` : ""}
                  </p>
                )}
                {c.role === "STUDENT" && c.classLabel && <p className="text-xs text-gray-500">{c.classLabel}</p>}
              </div>
              <Badge tone={roleTone[c.role as keyof typeof roleTone] ?? "gray"}>{c.role}</Badge>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-gray-500">Website</dt>
              <dd className="break-all font-medium text-gray-800">{loginUrl}</dd>
              <dt className="text-gray-500">Login ID</dt>
              <dd className="font-mono font-bold text-gray-900">{c.loginId}</dd>
              <dt className="text-gray-500">Password</dt>
              <dd className="font-mono font-bold text-gray-900">
                {c.temporaryPassword ?? (c.existingAccount ? "Use your existing password" : "—")}
              </dd>
            </dl>
            <p className="mt-2 text-[10px] text-gray-400">Please change your password after the first login.</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
