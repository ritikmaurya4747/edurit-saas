"use client";

import { useMemo, useState } from "react";
import { FileCheck2, Printer } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, PageHeader, QueryState, Select, StatTile } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useAcademicYears, useSections } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import {
  EXAM_INVALIDATE,
  EXAM_KEY,
  fmtPercent,
  gradeTone,
  useExams,
  useSectionResults,
  type ReportCardListItem,
  type ResultRow,
} from "../../exams/api";
import PrintAllCards from "./PrintAllCards";
import ReportCardView from "./ReportCardView";

type Row = ResultRow & { card?: ReportCardListItem };

const ReportCardsPage = () => {
  const can = useCan();
  const canGenerate = can(PERMISSIONS.REPORT_CARD_GENERATE);
  const years = useAcademicYears();
  const sections = useSections();

  const [yearId, setYearId] = useState("");
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [printAll, setPrintAll] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const effectiveYearId = yearId || years.data?.find((y) => y.isCurrent)?.id || years.data?.[0]?.id || null;
  const exams = useExams(effectiveYearId);
  const results = useSectionResults(examId || null, sectionId || null);
  const cards = useApiQuery<ReportCardListItem[]>(
    [EXAM_KEY, "report-cards", examId],
    examId && sectionId ? "report-cards" : null,
    { examId, sectionId },
  );

  const generate = useApiMutation(
    () => api.post<{ generated: number }>(`exams/${examId}/report-cards/generate`, { sectionId }),
    {
      invalidate: EXAM_INVALIDATE,
      success: (r) => `${r.generated} report card(s) generated`,
      onSuccess: () => setConfirmGenerate(false),
    },
  );

  const rows = useMemo<Row[]>(() => {
    const byStudent = new Map((cards.data ?? []).map((c) => [c.studentId, c]));
    return (results.data?.students ?? []).map((s) => ({ ...s, card: byStudent.get(s.studentId) }));
  }, [results.data, cards.data]);
  const withMarks = rows.filter((r) => r.percent !== null);
  const generatedCount = rows.filter((r) => r.card).length;
  const sectionLabel = results.data?.section.label ?? sections.data?.find((s) => s.id === sectionId)?.label ?? "";

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "rollNumber", header: "Roll", cell: ({ row }) => <span className="text-xs font-bold text-gray-500">{row.original.rollNumber ?? "—"}</span> },
      {
        accessorKey: "name",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900">{row.original.name}</p>
            <p className="text-[11px] text-gray-400">{row.original.admissionNumber}</p>
          </div>
        ),
      },
      { id: "percent", header: "Percent", cell: ({ row }) => <span className="font-bold">{fmtPercent(row.original.percent)}</span> },
      {
        id: "grade",
        header: "Grade",
        cell: ({ row }) => (row.original.grade ? <Badge tone={gradeTone(row.original.grade)}>{row.original.grade}</Badge> : "—"),
      },
      {
        id: "result",
        header: "Result",
        cell: ({ row }) =>
          row.original.result ? (
            <Badge tone={row.original.result === "PASS" ? "green" : "red"}>{row.original.result === "PASS" ? "Pass" : "Fail"}</Badge>
          ) : (
            <span className="text-xs text-gray-400">No marks</span>
          ),
      },
      { id: "rank", header: "Rank", cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.rank ?? "—"}</span> },
      {
        id: "card",
        header: "Report card",
        cell: ({ row }) =>
          row.original.card ? (
            <Badge tone="blue">Generated {formatDate(row.original.card.generatedAt)}</Badge>
          ) : (
            <Badge tone="gray">Not generated</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" disabled={row.original.percent === null} onClick={() => setViewing(row.original.studentId)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (viewing && examId) {
    return <ReportCardView studentId={viewing} examId={examId} onBack={() => setViewing(null)} />;
  }
  if (printAll && examId) {
    return (
      <PrintAllCards
        examId={examId}
        studentIds={withMarks.map((r) => r.studentId)}
        sectionLabel={sectionLabel}
        onBack={() => setPrintAll(false)}
      />
    );
  }

  const selectedExam = exams.data?.find((e) => e.id === examId);

  return (
    <div>
      <PageHeader
        title="Report Cards"
        description="Generate, review and print student report cards for each exam"
        actions={
          examId && sectionId ? (
            <>
              <Button variant="secondary" onClick={() => setPrintAll(true)} disabled={!withMarks.length}>
                <Printer className="h-4 w-4" /> Print all
              </Button>
              {canGenerate && (
                <Button onClick={() => setConfirmGenerate(true)} disabled={!withMarks.length}>
                  <FileCheck2 className="h-4 w-4" /> Generate report cards
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <Field label="Academic year">
          <Select
            value={effectiveYearId ?? ""}
            onChange={(e) => {
              setYearId(e.target.value);
              setExamId("");
            }}
            options={(years.data ?? []).map((y) => ({ value: y.id, label: `${y.name}${y.isCurrent ? " (current)" : ""}` }))}
          />
        </Field>
        <Field label="Exam">
          <Select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            placeholder={exams.isLoading ? "Loading…" : "Select exam"}
            options={(exams.data ?? []).map((x) => ({ value: x.id, label: `${x.name}${x.isPublished ? "" : " (draft)"}` }))}
          />
        </Field>
        <Field label="Section">
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            placeholder="Select section"
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
      </Card>

      {!examId || !sectionId ? (
        exams.data && exams.data.length === 0 ? (
          <EmptyState title="No exams in this academic year" description="Create an exam and enter marks on the Exams & Marks page first." />
        ) : (
          <EmptyState title="Pick an exam and a section" description="Students with their results and report card status will appear here." />
        )
      ) : (
        <QueryState
          isLoading={results.isLoading || cards.isLoading}
          error={results.error ?? cards.error}
          onRetry={() => {
            results.refetch();
            cards.refetch();
          }}
          isEmpty={!rows.length}
          empty={<EmptyState title="No students in this section" description="Enroll students in this section for the exam's academic year." />}
        >
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Students with marks" value={`${withMarks.length}/${rows.length}`} />
            <StatTile label="Report cards generated" value={generatedCount} tone={generatedCount < withMarks.length ? "warning" : "success"} />
            <StatTile label="Class average" value={fmtPercent(results.data?.sectionStats.average)} />
            <StatTile label="Pass percentage" value={fmtPercent(results.data?.sectionStats.passPercent)} />
          </div>
          {selectedExam && !selectedExam.isPublished && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
              {selectedExam.name} is still a draft — marks may change. Publish the exam before sharing report cards with parents.
            </p>
          )}
          {!withMarks.length && (
            <p className="mb-3 text-xs text-gray-500">No marks are entered for this section yet. Enter marks on the Exams &amp; Marks page.</p>
          )}
          <DataTable columns={columns} data={rows} />
        </QueryState>
      )}

      <ConfirmDialog
        open={confirmGenerate}
        onClose={() => setConfirmGenerate(false)}
        onConfirm={() => generate.mutate()}
        loading={generate.isPending}
        tone="primary"
        title={`Generate report cards for ${sectionLabel}?`}
        message="Percentages and grades are recalculated from the current marks. Remarks written by teachers are kept."
        confirmLabel="Generate"
      />
    </div>
  );
};

export default ReportCardsPage;
