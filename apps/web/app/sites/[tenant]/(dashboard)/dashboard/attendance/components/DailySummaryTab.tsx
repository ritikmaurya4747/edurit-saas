"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, EmptyState, Field, Input, QueryState, StatTile } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { schoolToday, type DailySummary, type SectionSummaryRow } from "../types";
import LinkButton from "./LinkButton";

const pct = (value: number | null) => (value == null ? "—" : `${value}%`);

const DailySummaryTab = () => {
  const user = useUser();
  const today = schoolToday(user?.timezone);
  const [date, setDate] = useState(today);

  const summary = useApiQuery<DailySummary>(["attendance", "summary", date], "attendance/summary", { date });
  const totals = summary.data?.totals;

  const columns = useMemo<ColumnDef<SectionSummaryRow>[]>(
    () => [
      { accessorKey: "label", header: "Section", cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.label}</span> },
      { accessorKey: "totalStudents", header: "Students" },
      {
        id: "marked",
        header: "Status",
        cell: ({ row }) =>
          row.original.marked ? <Badge tone="green">Marked</Badge> : <Badge tone="orange">Not marked</Badge>,
      },
      { accessorKey: "present", header: "Present", cell: ({ row }) => <span className="font-bold text-green-700">{row.original.present}</span> },
      { accessorKey: "absent", header: "Absent", cell: ({ row }) => <span className="font-bold text-red-600">{row.original.absent}</span> },
      { accessorKey: "late", header: "Late", cell: ({ row }) => <span className="font-bold text-yellow-600">{row.original.late}</span> },
      { accessorKey: "excused", header: "Excused", cell: ({ row }) => <span className="font-bold text-purple-700">{row.original.excused}</span> },
      {
        id: "percent",
        header: "Attendance",
        cell: ({ row }) => (
          <span className={`font-bold ${row.original.percent != null && row.original.percent < 75 ? "text-red-600" : "text-gray-900"}`}>
            {pct(row.original.percent)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Date" className="sm:w-56">
          <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
        </Field>
        {summary.data && <p className="text-sm text-gray-500">{formatDate(summary.data.date, true)}</p>}
      </div>

      <QueryState
        isLoading={summary.isLoading}
        error={summary.error}
        onRetry={() => summary.refetch()}
        isEmpty={!summary.data?.sections.length}
        empty={
          <EmptyState
            title="No sections yet"
            description="Create classes and sections in Academic Setup to see attendance summaries."
            action={<LinkButton href="/dashboard/academics">Go to Academic Setup</LinkButton>}
          />
        }
      >
        {totals && (
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatTile
              label="Attendance"
              value={pct(totals.percent)}
              hint={`${totals.marked} of ${totals.totalStudents} students marked`}
              tone={totals.percent != null && totals.percent < 75 ? "danger" : "success"}
            />
            <StatTile label="Present" value={totals.present + totals.late} hint={`incl. ${totals.late} late`} />
            <StatTile label="Absent" value={totals.absent} tone={totals.absent > 0 ? "warning" : "default"} />
            <StatTile label="Excused / on leave" value={totals.excused} />
            <StatTile
              label="Sections marked"
              value={`${totals.sectionsMarked}/${totals.sectionsTotal}`}
              tone={totals.sectionsMarked < totals.sectionsTotal ? "warning" : "success"}
              hint={totals.sectionsMarked < totals.sectionsTotal ? `${totals.sectionsTotal - totals.sectionsMarked} pending` : "All done"}
            />
          </div>
        )}
        <DataTable columns={columns} data={summary.data?.sections ?? []} />
      </QueryState>
    </div>
  );
};

export default DailySummaryTab;
