"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, Field, QueryState, Select, StatTile } from "@/components/ui";
import { useSections } from "@/lib/api/lookups";
import { cn } from "@/lib/utils/cn";
import { fmtMarks, fmtPercent, gradeTone, useSectionResults, type ExamListItem } from "../api";

interface Props {
  exams: ExamListItem[];
  initialExamId?: string;
}

const ResultsTab = ({ exams, initialExamId }: Props) => {
  const sections = useSections();
  const [examId, setExamId] = useState(initialExamId || "");
  const [sectionId, setSectionId] = useState("");
  const results = useSectionResults(examId || null, sectionId || null);
  const data = results.data;

  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <Field label="Exam">
          <Select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            placeholder="Select exam"
            options={exams.map((x) => ({ value: x.id, label: `${x.name}${x.isPublished ? " (published)" : ""}` }))}
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
        <EmptyState title="Pick an exam and a section" description="The result sheet with totals, grades and ranks will appear here." />
      ) : (
        <QueryState
          isLoading={results.isLoading}
          error={results.error}
          onRetry={() => results.refetch()}
          isEmpty={!data?.students.length || !data?.subjects.length}
          empty={
            <EmptyState
              title={data?.subjects.length ? "No students in this section" : "No subjects scheduled for this exam"}
              description={
                data?.subjects.length
                  ? "Enroll students in this section for the exam's academic year."
                  : "Add subject papers to the exam schedule and enter marks to see results."
              }
            />
          }
        >
          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Appeared" value={`${data.sectionStats.appeared}/${data.sectionStats.students}`} hint="Students with marks" />
                <StatTile label="Class average" value={fmtPercent(data.sectionStats.average)} />
                <StatTile label="Highest" value={fmtPercent(data.sectionStats.highest)} tone="success" />
                <StatTile
                  label="Pass percentage"
                  value={fmtPercent(data.sectionStats.passPercent)}
                  hint={`${data.sectionStats.passed} passed`}
                  tone={data.sectionStats.passPercent !== null && data.sectionStats.passPercent < 60 ? "warning" : "default"}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="bg-[#FCFBF8] text-xs font-bold uppercase tracking-wider text-gray-400">
                      <th className="sticky left-0 z-10 min-w-[200px] border-b border-r border-gray-200 bg-[#FCFBF8] px-4 py-3">Student</th>
                      {data.subjects.map((s) => (
                        <th key={s.examSubjectId} className="whitespace-nowrap border-b border-gray-200 px-3 py-3 text-center">
                          <span className="block text-gray-500">{s.subjectCode}</span>
                          <span className="text-[10px] font-semibold normal-case text-gray-400">/{fmtMarks(s.maxMarks)}</span>
                        </th>
                      ))}
                      <th className="border-b border-gray-200 px-3 py-3 text-center">Total</th>
                      <th className="border-b border-gray-200 px-3 py-3 text-center">%</th>
                      <th className="border-b border-gray-200 px-3 py-3 text-center">Grade</th>
                      <th className="border-b border-gray-200 px-3 py-3 text-center">Result</th>
                      <th className="border-b border-gray-200 px-3 py-3 text-center">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((row) => (
                      <tr key={row.studentId} className="group">
                        <td className="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-4 py-2.5 group-hover:bg-gray-50">
                          <p className="font-bold text-gray-900">
                            <span className="mr-2 text-xs text-gray-400">{row.rollNumber ?? "—"}</span>
                            {row.name}
                          </p>
                        </td>
                        {data.subjects.map((s) => {
                          const mark = row.marks[s.examSubjectId] ?? null;
                          return (
                            <td
                              key={s.examSubjectId}
                              className={cn(
                                "border-b border-gray-100 px-3 py-2.5 text-center font-semibold group-hover:bg-gray-50",
                                mark === null ? "text-gray-300" : mark < s.passingMarks ? "text-red-600" : "text-gray-800",
                              )}
                            >
                              {mark === null ? "AB" : fmtMarks(mark)}
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2.5 text-center font-bold text-gray-900 group-hover:bg-gray-50">
                          {row.maxTotal ? `${fmtMarks(row.total)}/${fmtMarks(row.maxTotal)}` : "—"}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center font-bold group-hover:bg-gray-50">{fmtPercent(row.percent)}</td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center group-hover:bg-gray-50">
                          {row.grade ? <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge> : "—"}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center group-hover:bg-gray-50">
                          {row.result ? <Badge tone={row.result === "PASS" ? "green" : "red"}>{row.result === "PASS" ? "Pass" : "Fail"}</Badge> : <span className="text-xs text-gray-400">No marks</span>}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center font-bold text-gray-900 group-hover:bg-gray-50">{row.rank ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">
                AB = absent / not entered (excluded from the total). A student fails if any subject is below its passing marks. Grades: A1 ≥ 91,
                A2 ≥ 81, B1 ≥ 71, B2 ≥ 61, C1 ≥ 51, C2 ≥ 41, D ≥ 33, E below 33.
              </p>
            </>
          )}
        </QueryState>
      )}
    </div>
  );
};

export default ResultsTab;
