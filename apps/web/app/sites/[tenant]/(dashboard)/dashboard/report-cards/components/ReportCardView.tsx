"use client";

import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, QueryState, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { EXAM_INVALIDATE, EXAM_KEY, type ReportCardDetail } from "../../exams/api";
import PrintStyles from "../../exams/components/PrintStyles";
import ReportCardLayout from "./ReportCardLayout";

const PRINT_ID = "report-card-print";

const ReportCardView = ({ studentId, examId, onBack }: { studentId: string; examId: string; onBack: () => void }) => {
  const card = useApiQuery<ReportCardDetail>([EXAM_KEY, "report-card", studentId, examId], `report-cards/student/${studentId}`, { examId });

  return (
    <div className="flex flex-col items-center">
      <PrintStyles targetId={PRINT_ID} />
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
        <Button onClick={() => window.print()} disabled={!card.data}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <div className="w-full">
        <QueryState isLoading={card.isLoading} error={card.error} onRetry={() => card.refetch()}>
          {card.data && (
            <div id={PRINT_ID} className="flex justify-center">
              <ReportCardLayout
                data={card.data}
                remarks={<RemarksEditor key={`${card.data.reportCardId}:${card.dataUpdatedAt}`} data={card.data} />}
              />
            </div>
          )}
        </QueryState>
      </div>
    </div>
  );
};

const RemarksEditor = ({ data }: { data: ReportCardDetail }) => {
  const can = useCan();
  const canEdit = can(PERMISSIONS.REPORT_CARD_GENERATE) && !!data.reportCardId;
  const [value, setValue] = useState(data.remarks ?? "");
  const save = useApiMutation(() => api.patch(`report-cards/${data.reportCardId}`, { remarks: value.trim() || null }), {
    invalidate: EXAM_INVALIDATE,
    success: "Remarks saved",
  });

  const printed = <p className="min-h-12 whitespace-pre-line text-sm text-gray-800">{data.remarks || "—"}</p>;
  if (!canEdit) {
    return (
      <>
        {printed}
        {!data.reportCardId && can(PERMISSIONS.REPORT_CARD_GENERATE) && (
          <p className="mt-2 text-xs text-gray-400 print:hidden">Generate report cards to write custom remarks.</p>
        )}
      </>
    );
  }

  const dirty = value.trim() !== (data.remarks ?? "");
  return (
    <>
      <div className="hidden print:block">{printed}</div>
      <div className="print:hidden">
        <Textarea value={value} maxLength={2000} onChange={(e) => setValue(e.target.value)} placeholder="Write remarks for this student…" />
        <div className="mt-2 flex items-center justify-end gap-2">
          {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved</span>}
          <Button size="sm" onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>
            Save remarks
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReportCardView;
