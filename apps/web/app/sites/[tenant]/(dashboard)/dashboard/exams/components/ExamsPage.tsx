"use client";

import { useState } from "react";
import { EmptyState, PageHeader, QueryState, Select, Tabs, type TabItem } from "@/components/ui";
import { useAcademicYears } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useExams } from "../api";
import ExamsTab from "./ExamsTab";
import MarksEntryTab from "./MarksEntryTab";
import ResultsTab from "./ResultsTab";

type TabId = "exams" | "marks" | "results";

const ExamsPage = () => {
  const can = useCan();
  const years = useAcademicYears();
  const [yearId, setYearId] = useState("");
  const [tab, setTab] = useState<TabId>("exams");
  // Exam picked on the Exams tab carries over to Marks / Results.
  const [focusExamId, setFocusExamId] = useState("");

  const effectiveYearId = yearId || years.data?.find((y) => y.isCurrent)?.id || years.data?.[0]?.id || null;
  const exams = useExams(effectiveYearId);

  const tabs: TabItem<TabId>[] = [
    { id: "exams", label: "Exams", count: exams.data?.length },
    ...(can(PERMISSIONS.MARKS_ENTRY) ? [{ id: "marks" as const, label: "Marks Entry" }] : []),
    { id: "results", label: "Results" },
  ];

  return (
    <div>
      <PageHeader
        title="Exams & Marks"
        description="Plan exams and their schedule, enter subject marks and review section results"
        actions={
          <div className="w-44">
            <Select
              aria-label="Academic year"
              value={effectiveYearId ?? ""}
              onChange={(e) => {
                setYearId(e.target.value);
                setFocusExamId("");
              }}
              options={(years.data ?? []).map((y) => ({ value: y.id, label: `${y.name}${y.isCurrent ? " (current)" : ""}` }))}
            />
          </div>
        }
      />

      <QueryState
        isLoading={years.isLoading}
        error={years.error}
        onRetry={() => years.refetch()}
        isEmpty={!years.data?.length}
        empty={
          <EmptyState
            title="No academic year configured"
            description="Create an academic year in Academic Setup before planning exams."
          />
        }
      >
        <Tabs<TabId> active={tab} onChange={setTab} tabs={tabs} />

        {tab === "exams" && (
          <ExamsTab
            academicYearId={effectiveYearId}
            exams={exams}
            onOpenMarks={(examId) => {
              setFocusExamId(examId);
              setTab("marks");
            }}
            onOpenResults={(examId) => {
              setFocusExamId(examId);
              setTab("results");
            }}
          />
        )}
        {tab === "marks" && <MarksEntryTab exams={exams.data ?? []} initialExamId={focusExamId} />}
        {tab === "results" && <ResultsTab exams={exams.data ?? []} initialExamId={focusExamId} />}
      </QueryState>
    </div>
  );
};

export default ExamsPage;
