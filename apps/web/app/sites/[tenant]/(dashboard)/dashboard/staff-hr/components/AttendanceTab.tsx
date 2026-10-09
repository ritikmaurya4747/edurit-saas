"use client";

import { useMemo, useState } from "react";
import { LogIn, LogOut, UserX } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, QueryState, Select, StatTile } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatTime, todayInput } from "@/lib/utils/format";
import type { AttendanceReport, AttendanceReportRow, AttendanceStatus, RosterResponse, RosterRow } from "../types";
import { ATTENDANCE_OPTIONS, AttendanceBadge, MONTH_OPTIONS, PersonCell, STAFF_INVALIDATE, leaveTypeLabel, monthLabel, yearOptions } from "./shared";

type View = "daily" | "report";

export default function AttendanceTab() {
  const [view, setView] = useState<View>("daily");
  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {(
          [
            { id: "daily", label: "Daily register" },
            { id: "report", label: "Monthly report" },
          ] as const
        ).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
              view === v.id ? "bg-[#1C263A] text-white" : "text-gray-500 hover:text-gray-800",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === "daily" ? <DailyRegister /> : <MonthlyReport />}
    </div>
  );
}

function DailyRegister() {
  const can = useCan();
  const canManage = can(PERMISSIONS.STAFF_ATTENDANCE_MANAGE);
  const [date, setDate] = useState(todayInput());
  const [confirmRemaining, setConfirmRemaining] = useState(false);

  const roster = useApiQuery<RosterResponse>(["staff", "attendance", "roster"], "staff-attendance", { date });
  const rows = useMemo(() => roster.data?.staff ?? [], [roster.data]);
  const isToday = !!roster.data?.isToday;

  const checkIn = useApiMutation((staffId: string) => api.post("staff-attendance/check-in", { staffId }), {
    invalidate: STAFF_INVALIDATE,
    success: "Checked in",
  });
  const checkOut = useApiMutation((staffId: string) => api.post("staff-attendance/check-out", { staffId }), {
    invalidate: STAFF_INVALIDATE,
    success: "Checked out",
  });
  const mark = useApiMutation(
    (records: { staffId: string; status: AttendanceStatus; remarks?: string }[]) => api.put("staff-attendance/bulk", { date, records }),
    { invalidate: STAFF_INVALIDATE, success: "Attendance saved", onSuccess: () => setConfirmRemaining(false) },
  );

  const unmarked = rows.filter((r) => !r.record);
  const counts = {
    present: rows.filter((r) => r.record?.status === "PRESENT").length,
    late: rows.filter((r) => r.record?.status === "LATE").length,
    absent: rows.filter((r) => r.record?.status === "ABSENT").length,
    onLeave: rows.filter((r) => r.onLeave).length,
  };
  const busyIn = checkIn.isPending ? checkIn.variables : null;
  const busyOut = checkOut.isPending ? checkOut.variables : null;
  const { mutate: markRecords, isPending: marking } = mark;
  const { mutate: doCheckIn } = checkIn;
  const { mutate: doCheckOut } = checkOut;

  const columns = useMemo<ColumnDef<RosterRow>[]>(
    () => [
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PersonCell name={row.original.name} sub={[row.original.employeeCode, row.original.designation].filter(Boolean).join(" · ")} />
            {row.original.onLeave && <Badge tone="blue">On leave{row.original.leaveType ? ` · ${leaveTypeLabel(row.original.leaveType)}` : ""}</Badge>}
          </div>
        ),
      },
      {
        id: "checkIn",
        header: "Check-in",
        cell: ({ row }) => <span className="font-medium text-gray-900">{formatTime(row.original.record?.checkIn)}</span>,
      },
      {
        id: "checkOut",
        header: "Check-out",
        cell: ({ row }) => <span className="font-medium text-gray-900">{formatTime(row.original.record?.checkOut)}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original;
          if (!canManage) return r.record ? <AttendanceBadge status={r.record.status} /> : <span className="text-xs text-gray-400">Not marked</span>;
          return (
            <Select
              className="min-w-[130px] py-1.5 text-xs"
              value={r.record?.status ?? ""}
              disabled={marking}
              onChange={(e) => e.target.value && markRecords([{ staffId: r.staffId, status: e.target.value as AttendanceStatus }])}
              placeholder="Not marked"
              options={ATTENDANCE_OPTIONS}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const r = row.original;
          if (!canManage || !isToday) return null;
          if (!r.record?.checkIn)
            return (
              <Button variant="outline" size="sm" loading={busyIn === r.staffId} onClick={() => doCheckIn(r.staffId)}>
                <LogIn className="h-3.5 w-3.5" /> Check in
              </Button>
            );
          if (!r.record.checkOut)
            return (
              <Button variant="outline" size="sm" loading={busyOut === r.staffId} onClick={() => doCheckOut(r.staffId)}>
                <LogOut className="h-3.5 w-3.5" /> Check out
              </Button>
            );
          return <span className="text-xs text-gray-400">Completed</span>;
        },
      },
    ],
    [canManage, isToday, marking, markRecords, doCheckIn, doCheckOut, busyIn, busyOut],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Date" className="sm:w-52">
          <Input type="date" value={date} max={todayInput()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        {canManage && unmarked.length > 0 && (
          <Button variant="secondary" onClick={() => setConfirmRemaining(true)}>
            <UserX className="h-4 w-4" /> Mark remaining absent ({unmarked.length})
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Present" value={counts.present} tone="success" />
          <StatTile label="Late" value={counts.late} tone="warning" />
          <StatTile label="Absent" value={counts.absent} tone={counts.absent ? "danger" : "default"} />
          <StatTile label="On leave" value={counts.onLeave} />
          <StatTile label="Not marked" value={unmarked.length} hint={`of ${rows.length} staff`} />
        </div>
      )}

      <QueryState
        isLoading={roster.isLoading}
        error={roster.error}
        onRetry={() => roster.refetch()}
        isEmpty={!rows.length}
        empty={<EmptyState title="No active staff" description="Add staff members in the Directory tab to start recording their attendance." />}
      >
        <DataTable columns={columns} data={rows} />
      </QueryState>

      <ConfirmDialog
        open={confirmRemaining}
        onClose={() => setConfirmRemaining(false)}
        tone="primary"
        loading={mark.isPending}
        onConfirm={() =>
          mark.mutate(
            unmarked.map((r) =>
              r.onLeave ? { staffId: r.staffId, status: "EXCUSED" as const, remarks: "On approved leave" } : { staffId: r.staffId, status: "ABSENT" as const },
            ),
          )
        }
        title="Mark remaining staff?"
        message={`${unmarked.filter((r) => !r.onLeave).length} staff without a record on ${formatDate(date)} will be marked absent and ${
          unmarked.filter((r) => r.onLeave).length
        } on approved leave will be marked excused.`}
        confirmLabel="Mark attendance"
      />
    </div>
  );
}

function MonthlyReport() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const report = useApiQuery<AttendanceReport>(["staff", "attendance", "report"], "staff-attendance/report", { month, year });

  const columns = useMemo<ColumnDef<AttendanceReportRow>[]>(
    () => [
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) => <PersonCell name={row.original.name} sub={[row.original.employeeCode, row.original.designation].filter(Boolean).join(" · ")} />,
      },
      { accessorKey: "workingDays", header: "Working days" },
      { accessorKey: "present", header: "Present", cell: ({ row }) => <span className="font-bold text-green-700">{row.original.present}</span> },
      { accessorKey: "late", header: "Late", cell: ({ row }) => <span className="font-bold text-orange-600">{row.original.late}</span> },
      { accessorKey: "absent", header: "Absent", cell: ({ row }) => <span className="font-bold text-red-600">{row.original.absent}</span> },
      { accessorKey: "excused", header: "Excused" },
      { accessorKey: "onLeaveDays", header: "On leave" },
      {
        id: "rate",
        header: "Attendance",
        cell: ({ row }) => {
          const r = row.original;
          if (!r.workingDays) return "—";
          const pct = Math.round(((r.present + r.late) / r.workingDays) * 100);
          return <span className={cn("font-bold", pct >= 90 ? "text-green-700" : pct >= 75 ? "text-orange-600" : "text-red-600")}>{pct}%</span>;
        },
      },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:w-96">
        <Select value={month} onChange={(e) => setMonth(e.target.value)} options={MONTH_OPTIONS} />
        <Select value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions()} />
      </div>
      <QueryState
        isLoading={report.isLoading}
        error={report.error}
        onRetry={() => report.refetch()}
        isEmpty={!report.data?.rows.length}
        empty={<EmptyState title="No active staff" description="The monthly report lists every active staff member." />}
      >
        <p className="mb-2 text-xs text-gray-500">
          {monthLabel(Number(month), Number(year))} · working days are Monday–Saturday up to today.
        </p>
        <DataTable columns={columns} data={report.data?.rows ?? []} />
      </QueryState>
    </div>
  );
}
