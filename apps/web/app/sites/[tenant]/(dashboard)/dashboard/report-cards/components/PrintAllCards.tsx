"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { EXAM_KEY, type ReportCardDetail } from "../../exams/api";
import PrintStyles from "../../exams/components/PrintStyles";
import ReportCardLayout from "./ReportCardLayout";

const PRINT_ID = "report-card-print";

// Every report card of a section, one per printed page.
const PrintAllCards = ({
  examId,
  studentIds,
  sectionLabel,
  onBack,
}: {
  examId: string;
  studentIds: string[];
  sectionLabel: string;
  onBack: () => void;
}) => {
  const cards = useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: [EXAM_KEY, "report-card", studentId, examId, { examId }],
      queryFn: () => api.get<ReportCardDetail>(`report-cards/student/${studentId}`, { examId }),
      staleTime: 30_000,
      retry: false,
    })),
  });

  const loaded = cards.filter((c) => c.data).length;
  const failed = cards.filter((c) => c.error);
  const ready = loaded + failed.length === cards.length;

  return (
    <div className="flex flex-col items-center">
      <PrintStyles targetId={PRINT_ID} />
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">
            {sectionLabel} · {loaded}/{cards.length} report cards ready
          </span>
          <Button onClick={() => window.print()} disabled={!ready || loaded === 0}>
            <Printer className="h-4 w-4" /> Print all
          </Button>
        </div>
      </div>

      {!ready && <LoadingState label={`Preparing report cards (${loaded}/${cards.length})…`} className="print:hidden" />}
      {failed.length > 0 && (
        <div className="mb-4 w-full print:hidden">
          <ErrorState message={`${failed.length} report card(s) could not be loaded: ${failed[0]?.error?.message ?? ""}`} />
        </div>
      )}

      <div id={PRINT_ID} className="flex w-full flex-col items-center gap-8 print:block">
        {cards.map((c, i) =>
          c.data ? (
            <div key={studentIds[i]} className="print-page flex w-full justify-center">
              <ReportCardLayout data={c.data} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

export default PrintAllCards;
