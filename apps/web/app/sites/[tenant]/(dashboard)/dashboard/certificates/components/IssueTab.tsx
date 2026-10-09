"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, QueryState, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import type { StudentOption } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { todayInput } from "@/lib/utils/format";
import CertificateDocument from "./CertificateDocument";
import { PRINT_ID, PrintStyles } from "./print";
import StudentPicker from "./StudentPicker";
import {
  CERTIFICATE_KEYS,
  TYPE_META,
  type CertificateDetails,
  type CertificatePreview,
  type DocumentType,
  type IssuedCertificateDetail,
} from "./types";

const DOC_TYPES: DocumentType[] = ["BONAFIDE", "CHARACTER", "TC"];

const CONDUCT_OPTIONS = ["Excellent", "Very Good", "Good", "Satisfactory"].map((c) => ({ value: c, label: c }));

const TC_REASONS = [
  "Parent's transfer to another city",
  "Change of school",
  "Completed schooling",
  "Relocation of family",
  "Personal reasons",
].map((r) => ({ value: r, label: r }));

type Fields = Required<Pick<CertificateDetails, "reason" | "leavingDate" | "conduct" | "remarks" | "purpose">>;

const initialFields = (): Fields => ({
  reason: "",
  leavingDate: todayInput(),
  conduct: "Good",
  remarks: "",
  purpose: "",
});

const IssueTab = () => {
  const can = useCan();
  const canIssue = can(PERMISSIONS.CERTIFICATE_ISSUE);

  const [type, setType] = useState<DocumentType>("BONAFIDE");
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [issued, setIssued] = useState<IssuedCertificateDetail | null>(null);

  const preview = useApiQuery<CertificatePreview>(
    ["certificates", "preview", type, student?.id],
    student ? "certificates/preview" : null,
    { type, studentId: student?.id },
  );

  const issue = useApiMutation(
    (body: { type: DocumentType; studentId: string; data: Partial<Fields> }) =>
      api.post<IssuedCertificateDetail>("certificates", body),
    {
      invalidate: CERTIFICATE_KEYS,
      success: (r) => `${TYPE_META[r.type].title} ${r.serialNumber} issued`,
      onSuccess: (r) => {
        setIssued(r);
        // Let the issued document render before opening the print dialog.
        setTimeout(() => window.print(), 400);
      },
    },
  );

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setIssued(null);
    setStudent(null);
    setFields(initialFields());
  };

  // Only the fields relevant to the chosen type are submitted.
  const submittedData = (): Partial<Fields> => {
    const pick = (keys: (keyof Fields)[]) =>
      Object.fromEntries(keys.map((k) => [k, fields[k].trim()]).filter(([, v]) => v)) as Partial<Fields>;
    if (type === "TC") return pick(["leavingDate", "reason", "conduct", "remarks"]);
    if (type === "BONAFIDE") return pick(["purpose", "remarks"]);
    return pick(["conduct", "remarks"]);
  };

  const missing =
    !student ? "Choose a student" : type === "TC" && (!fields.leavingDate || !fields.reason.trim()) ? "Enter the date and reason for leaving" : null;

  const locked = !!issued;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_1fr]">
      <PrintStyles />

      {/* Form */}
      <div className="space-y-5 print:hidden">
        {issued && (
          <Card className="border-green-200 bg-green-50/60 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-green-800">
                  {TYPE_META[issued.type].title} issued — {issued.serialNumber}
                </p>
                <p className="text-xs text-green-700">
                  {issued.student.name} · stored in the register for reprints.
                  {issued.details.studentStatusChanged && " The student is now marked as Transferred."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" /> Print again
                  </Button>
                  <Button size="sm" variant="secondary" onClick={reset}>
                    <RotateCcw className="h-3.5 w-3.5" /> Issue another
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-700">Certificate type</p>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={locked}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                    type === t ? "border-[#1C263A] bg-[#1C263A] text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  )}
                >
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">{TYPE_META[type].description}</p>
          </div>

          <Field label="Student" required>
            <StudentPicker value={student} onChange={setStudent} disabled={locked} />
          </Field>

          {type === "TC" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Date of leaving" required>
                <Input type="date" required disabled={locked} value={fields.leavingDate} onChange={(e) => set("leavingDate", e.target.value)} />
              </Field>
              <Field label="Reason for leaving" required>
                <Input
                  list="tc-reasons"
                  required
                  maxLength={500}
                  disabled={locked}
                  value={fields.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  placeholder="e.g. Parent's transfer to another city"
                />
                <datalist id="tc-reasons">
                  {TC_REASONS.map((r) => (
                    <option key={r.value} value={r.value} />
                  ))}
                </datalist>
              </Field>
            </div>
          )}

          {type === "BONAFIDE" && (
            <Field label="Purpose" hint="e.g. Opening a bank account, passport, scholarship">
              <Input maxLength={255} disabled={locked} value={fields.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="General purpose" />
            </Field>
          )}

          {(type === "TC" || type === "CHARACTER") && (
            <Field label="General conduct">
              <Select disabled={locked} value={fields.conduct} options={CONDUCT_OPTIONS} onChange={(e) => set("conduct", e.target.value)} />
            </Field>
          )}

          <Field label="Remarks">
            <Textarea rows={3} maxLength={1000} disabled={locked} value={fields.remarks} onChange={(e) => set("remarks", e.target.value)} placeholder="Optional" />
          </Field>

          {type === "TC" && !locked && (
            <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Issuing a TC marks an active student as Transferred.
            </p>
          )}

          {canIssue ? (
            !locked && (
              <Button
                className="w-full"
                disabled={!!missing || !preview.data}
                loading={issue.isPending}
                title={missing ?? undefined}
                onClick={() => student && issue.mutate({ type, studentId: student.id, data: submittedData() })}
              >
                <Printer className="h-4 w-4" /> Issue &amp; Print
              </Button>
            )
          ) : (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              You can preview certificates. Issuing requires the “Issue certificates” permission.
            </p>
          )}
        </Card>
      </div>

      {/* Preview */}
      <div className="min-w-0">
        {issued?.snapshot ? (
          <div id={PRINT_ID} className="overflow-x-auto">
            <CertificateDocument
              type={issued.type as DocumentType}
              snapshot={issued.snapshot}
              details={issued.details}
              serialNumber={issued.serialNumber}
              issueDate={issued.details.issueDate ?? issued.issuedAt}
            />
          </div>
        ) : !student ? (
          <EmptyState
            title="Choose a student to preview the certificate"
            description="The live preview uses the school profile, student record, guardians, class and attendance."
          />
        ) : (
          <QueryState isLoading={preview.isLoading} error={preview.error} onRetry={() => preview.refetch()}>
            {preview.data && (
              <div className="space-y-3">
                {preview.data.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 print:hidden">
                    {preview.data.warnings.map((w) => (
                      <p key={w} className="flex gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <CertificateDocument
                    type={type}
                    snapshot={preview.data}
                    details={{ ...submittedData(), purpose: fields.purpose.trim() || "General purpose" }}
                    issueDate={preview.data.issueDate}
                  />
                </div>
              </div>
            )}
          </QueryState>
        )}
      </div>
    </div>
  );
};

export default IssueTab;
