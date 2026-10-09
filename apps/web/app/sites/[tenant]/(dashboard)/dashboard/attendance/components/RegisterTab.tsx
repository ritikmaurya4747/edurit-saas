"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { EmptyState, Field, Input, QueryState, Select, StatTile } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { schoolToday, type AttendanceReport, type ReportStudent } from "../types";
import LinkButton from "./LinkButton";

const LOW_ATTENDANCE = 75;

const RegisterTab = () => {
  const user = useUser();
  const today = schoolToday(user?.timezone);
  const sections = useSections();
  const [pickedSection, setPickedSection] = useState("");
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);

  const sectionId = pickedSection || sections.data?.[0]?.id || "";
  const validRange = !!from && !!to && from <= to;

  const report = useApiQuery<AttendanceReport>(
    ["attendance", "report", sectionId, from, to],
    sectionId && validRange ? "attendance/report" : null,
    { sectionId, from, to },
  );

  const students = report.data?.students ?? [];
  const lowCount = students.filter((s) => s.percent != null && s.percent < LOW_ATTENDANCE).length;
  const marked = students.reduce((sum, s) => sum + s.marked, 0);
  const attended = students.reduce((sum, s) => sum + s.present + s.late, 0);
  const average = marked ? Math.round((attended / marked) * 1000) / 10 : null;

  const columns = useMemo<ColumnDef<ReportStudent>[]>(
    () => [
      { accessorKey: "rollNumber", header: "Roll", cell: ({ row }) => row.original.rollNumber ?? "—" },
      {
        accessorKey: "name",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-gray-900">{row.original.name}</div>
            <div className="text-xs text-gray-400">{row.original.admissionNumber}</div>
          </div>
        ),
      },
      { accessorKey: "present", header: "Present", cell: ({ row }) => <span className="font-bold text-green-700">{row.original.present}</span> },
      { accessorKey: "absent", header: "Absent", cell: ({ row }) => <span className="font-bold text-red-600">{row.original.absent}</span> },
      { accessorKey: "late", header: "Late", cell: ({ row }) => <span className="font-bold text-yellow-600">{row.original.late}</span> },
      { accessorKey: "excused", header: "Excused", cell: ({ row }) => <span className="font-bold text-purple-700">{row.original.excused}</span> },
      {
        id: "percent",
        header: "Attendance %",
        cell: ({ row }) => {
          const p = row.original.percent;
          if (p == null) return <span className="text-gray-400">—</span>;
          return (
            <span
              className={`inline-flex rounded-md px-2 py-0.5 font-bold ${
                p < LOW_ATTENDANCE ? "bg-red-50 text-red-700" : "text-gray-900"
              }`}
            >
              {p}%
            </span>
          );
        },
      },
    ],
    [],
  );

  if (!sections.isLoading && !sections.error && !sections.data?.length) {
    return (
      <EmptyState
        title="No sections yet"
        description="Create classes and sections in Academic Setup to view attendance registers."
        action={<LinkButton href="/dashboard/academics">Go to Academic Setup</LinkButton>}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
        <Field label="Section">
          <Select
            value={sectionId}
            onChange={(e) => setPickedSection(e.target.value)}
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
        <Field label="From">
          <Input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To" error={!validRange ? "Choose a valid range" : undefined}>
          <Input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <QueryState
        isLoading={sections.isLoading || report.isLoading}
        error={sections.error || report.error}
        onRetry={() => (sections.error ? sections.refetch() : report.refetch())}
        isEmpty={!!report.data && !students.length}
        empty={
          <EmptyState
            title="No students in this section"
            description="Enroll students into this section for the current academic year."
          />
        }
      >
        {report.data && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                label="Working days"
                value={report.data.workingDays}
                hint={`${formatDate(report.data.from)} – ${formatDate(report.data.to)}`}
              />
              <StatTile label="Students" value={students.length} />
              <StatTile
                label="Average attendance"
                value={average == null ? "—" : `${average}%`}
                tone={average != null && average < LOW_ATTENDANCE ? "danger" : "default"}
              />
              <StatTile
                label={`Below ${LOW_ATTENDANCE}%`}
                value={lowCount}
                tone={lowCount > 0 ? "danger" : "success"}
                hint={lowCount > 0 ? "Need follow-up" : "Everyone on track"}
              />
            </div>
            {report.data.workingDays === 0 ? (
              <EmptyState
                title="No attendance marked in this period"
                description="Attendance taken from the Mark Attendance tab will show up here."
              />
            ) : (
              <DataTable columns={columns} data={students} />
            )}
          </>
        )}
      </QueryState>
    </div>
  );
};

export default RegisterTab;
