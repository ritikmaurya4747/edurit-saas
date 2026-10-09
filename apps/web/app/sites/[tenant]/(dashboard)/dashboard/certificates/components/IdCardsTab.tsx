"use client";

import { useState } from "react";
import { BadgeCheck, Printer } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import IdCard from "./IdCard";
import { PRINT_ID, PrintStyles } from "./print";
import { CERTIFICATE_KEYS, type IdCardsResponse } from "./types";

const IdCardsTab = () => {
  const can = useCan();
  const canIssue = can(PERMISSIONS.CERTIFICATE_ISSUE);
  const sections = useSections();
  const [sectionId, setSectionId] = useState("");
  const [validUptoInput, setValidUptoInput] = useState("");

  const cards = useApiQuery<IdCardsResponse>(["certificates", "id-cards", sectionId], sectionId ? "certificates/id-cards" : null, {
    sectionId,
  });
  const validUpto = validUptoInput || cards.data?.defaultValidUpto || "";

  const markIssued = useApiMutation(
    () => api.post<{ created: number; skipped: number }>("certificates/id-cards/issue", { sectionId, validUpto }),
    {
      invalidate: CERTIFICATE_KEYS,
      success: (r) =>
        r.created
          ? `${r.created} ID card${r.created === 1 ? "" : "s"} recorded as issued${r.skipped ? ` (${r.skipped} already issued)` : ""}`
          : "Every student already has an ID card with this validity",
    },
  );

  const students = cards.data?.students ?? [];
  const issuedCount = students.filter((s) => s.issued && s.issued.validUpto === validUpto).length;

  return (
    <div className="space-y-5">
      <PrintStyles />
      <Card className="p-4 print:hidden">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
          <Field label="Section">
            <Select
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                setValidUptoInput("");
              }}
              options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
              placeholder={sections.isLoading ? "Loading sections…" : "Choose a section"}
            />
          </Field>
          <Field label="Valid upto">
            <Input type="date" value={validUpto} onChange={(e) => setValidUptoInput(e.target.value)} disabled={!sectionId} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!students.length} onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print all
            </Button>
            {canIssue && (
              <Button
                disabled={!students.length || !validUpto}
                loading={markIssued.isPending}
                onClick={() => markIssued.mutate()}
              >
                <BadgeCheck className="h-4 w-4" /> Mark as issued
              </Button>
            )}
          </div>
        </div>
        {cards.data && (
          <p className="mt-3 text-xs text-gray-500">
            {cards.data.section.label} · {cards.data.academicYear.name} · {students.length} active student
            {students.length === 1 ? "" : "s"} · {issuedCount} already issued for {validUpto ? formatDate(validUpto) : "this validity"}
          </p>
        )}
      </Card>

      {!sectionId ? (
        <EmptyState
          title="Choose a section to print ID cards"
          description="Cards are generated for every active student of the section in the current academic year."
        />
      ) : (
        <QueryState
          isLoading={cards.isLoading}
          error={cards.error}
          onRetry={() => cards.refetch()}
          isEmpty={students.length === 0}
          empty={
            <EmptyState
              title="No active students in this section"
              description="Enroll students in this section from the Students page to print their ID cards."
            />
          }
        >
          {cards.data && (
            <div id={PRINT_ID} className="flex flex-wrap justify-center gap-5 md:justify-start print:justify-start print:gap-[5mm]">
              {students.map((s) => (
                <div key={s.studentId} className="print-avoid-break flex flex-col gap-1.5">
                  <IdCard school={cards.data.school} card={s} validUpto={validUpto} />
                  <div className="flex h-6 items-center print:hidden">
                    {s.issued ? (
                      <Badge tone={s.issued.validUpto === validUpto ? "green" : "gray"}>
                        {s.issued.serialNumber}
                        {s.issued.validUpto ? ` · valid ${formatDate(s.issued.validUpto)}` : ""}
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400">Not issued yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      )}
    </div>
  );
};

export default IdCardsTab;
