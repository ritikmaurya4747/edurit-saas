"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { Printer } from "lucide-react";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { PortalChild, PortalExamResult, PortalResults } from "../../types";
import PortalPage from "../../components/PortalPage";
import { numberish, PrintStyles } from "../../components/portal-ui";

const PRINT_ID = "portal-results-print";

export default function MyResultsPage() {
  return <PortalPage title="Results">{(student) => <ResultsBody key={student.id} student={student} />}</PortalPage>;
}

function ResultsBody({ student }: { student: PortalChild }) {
  const user = useUser();
  // When set, only that exam is printed; otherwise every exam card prints.
  const [printOnly, setPrintOnly] = useState<string | null>(null);
  const query = useApiQuery<PortalResults>([PORTAL_KEY, "results", student.id], portalPath(student.id, "results"));

  if (query.isLoading) return <LoadingState label="Loading results…" />;
  if (query.error || !query.data) {
    return <ErrorState message={query.error?.message ?? "Could not load results."} onRetry={() => query.refetch()} />;
  }
  const exams = query.data.exams;
  if (!exams.length) {
    return <EmptyState title="No results published yet" description="Exam results appear here as soon as the school publishes them." />;
  }

  const print = (examId: string | null) => {
    flushSync(() => setPrintOnly(examId));
    window.print();
    setPrintOnly(null);
  };

  return (
    <div>
      <PrintStyles targetId={PRINT_ID} />
      <div className="mb-4 flex justify-end print:hidden">
        <Button variant="secondary" size="sm" onClick={() => print(null)}>
          <Printer className="h-4 w-4" /> Print all
        </Button>
      </div>

      <div id={PRINT_ID} className="space-y-4">
        <div className="hidden border-b border-gray-300 pb-3 print:block">
          <p className="font-serif text-xl font-bold">{user?.tenantName}</p>
          <p className="text-sm">
            {student.name} · Adm. no {student.admissionNumber}
          </p>
        </div>
        {exams.map((r) => (
          <ExamCard key={r.exam.id} result={r} onPrint={() => print(r.exam.id)} hidden={printOnly != null && printOnly !== r.exam.id} />
        ))}
      </div>
    </div>
  );
}

function ExamCard({ result: r, onPrint, hidden }: { result: PortalExamResult; onPrint: () => void; hidden: boolean }) {
  return (
    <article
      className={cn(
        "print-avoid-break rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 print:rounded-none print:border-gray-400 print:shadow-none",
        hidden && "print:hidden",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-gray-900">{r.exam.name}</h2>
          <p className="text-xs text-gray-500">
            {r.exam.academicYear} · {r.sectionLabel}
            {r.rollNumber != null ? ` · Roll ${r.rollNumber}` : ""} · {formatDate(r.exam.startDate)} – {formatDate(r.exam.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {r.result && <Badge tone={r.result === "PASS" ? "green" : "red"}>{r.result === "PASS" ? "Passed" : "Needs improvement"}</Badge>}
          <Button variant="ghost" size="sm" onClick={onPrint} className="print:hidden" aria-label={`Print ${r.exam.name}`}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {!r.hasMarks ? (
        <p className="mt-4 rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
          Marks for this exam are not available.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label="Total" value={`${numberish(r.total)} / ${numberish(r.maxTotal)}`} />
            <Figure label="Percentage" value={r.percent != null ? `${r.percent}%` : "—"} />
            <Figure label="Grade" value={r.grade ?? "—"} />
            <Figure
              label="Rank in class"
              value={r.rank ? `${r.rank}` : "—"}
              hint={r.classSize ? `of ${r.classSize}${r.classAverage != null ? ` · class avg ${r.classAverage}%` : ""}` : undefined}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3">Subject</th>
                  <th className="px-3 py-2 text-right">Max</th>
                  <th className="px-3 py-2 text-right">Pass</th>
                  <th className="px-3 py-2 text-right">Obtained</th>
                  <th className="py-2 pl-3 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.subjects.map((s) => (
                  <tr key={s.examSubjectId}>
                    <td className="py-2 pr-3 font-semibold text-gray-900">
                      {s.name}
                      {s.remarks && <span className="block text-[11px] font-normal text-gray-500">{s.remarks}</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{numberish(s.maxMarks)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{numberish(s.passingMarks)}</td>
                    <td className={cn("px-3 py-2 text-right font-bold", s.passed === false ? "text-red-600" : "text-gray-900")}>
                      {s.marksObtained != null ? numberish(s.marksObtained) : <span className="font-normal text-gray-400">Absent / NA</span>}
                    </td>
                    <td className="py-2 pl-3 text-right font-bold text-gray-900">{s.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {r.remarks && (
            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Remarks: </span>
              {r.remarks}
            </p>
          )}
        </>
      )}
    </article>
  );
}

const Figure = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
    <p className="text-[11px] font-medium text-gray-500">{label}</p>
    <p className="font-serif text-xl font-bold text-gray-900">{value}</p>
    {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
  </div>
);
