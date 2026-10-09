"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Button, Card, Checkbox, EmptyState, Field, PageHeader, Select } from "@/components/ui";
import CredentialsSheet, { type IssuedCredential } from "@/components/credentials/CredentialsSheet";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";

interface BulkResult {
  classLabel: string;
  credentials: IssuedCredential[];
  skipped: { name: string; role: string; reason: string }[];
}

// Industry pattern: at onboarding (or a new session) the office issues
// logins section by section and hands out printed slips via class teachers.
export default function BulkLoginsPage() {
  const can = useCan();
  const sections = useSections();
  const [sectionId, setSectionId] = useState("");
  const [options, setOptions] = useState({ includeStudents: true, includeParents: true, resetExisting: false });
  const [result, setResult] = useState<BulkResult | null>(null);

  const generate = useApiMutation(
    () => api.post<BulkResult>("students/logins/bulk", { sectionId, ...options }),
    {
      invalidate: [["students"]],
      success: (r) => `${r.credentials.length} login(s) ready for ${r.classLabel}`,
      onSuccess: setResult,
    },
  );

  if (!can(PERMISSIONS.STUDENT_UPDATE)) {
    return <EmptyState title="Not allowed" description="You need permission to update students to issue logins." />;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/students" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Students
      </Link>
      <PageHeader
        title="Student & Parent Logins"
        description="Create portal logins for a whole class section and print the credential slips."
      />

      <Card className="space-y-5 p-5">
        <Field label="Class & section" required>
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            placeholder={sections.isLoading ? "Loading…" : "Choose a section"}
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: `${s.label} (${s.studentCount} students)` }))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="Student logins (admission number)"
            checked={options.includeStudents}
            onChange={(includeStudents) => setOptions({ ...options, includeStudents })}
          />
          <Checkbox
            label="Parent logins (mobile number)"
            checked={options.includeParents}
            onChange={(includeParents) => setOptions({ ...options, includeParents })}
          />
          <Checkbox
            label="Also reset people who already have a login"
            checked={options.resetExisting}
            onChange={(resetExisting) => setOptions({ ...options, resetExisting })}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>
            Temporary passwords are shown only once and everyone must change theirs at first login. Parents with children in
            several sections get a single login. Accounts shared with another school keep their existing password.
          </span>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => generate.mutate()}
            loading={generate.isPending}
            disabled={!sectionId || (!options.includeStudents && !options.includeParents)}
          >
            <KeyRound className="h-4 w-4" /> Generate logins
          </Button>
        </div>
      </Card>

      <CredentialsSheet
        open={!!result}
        onClose={() => setResult(null)}
        title={result ? `Logins — ${result.classLabel}` : "Logins"}
        credentials={result?.credentials ?? []}
        skipped={result?.skipped ?? []}
      />
    </div>
  );
}
