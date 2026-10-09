"use client";

import { useMemo, useState } from "react";
import { Phone, Wallet } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Button, EmptyState, QueryState, Select } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { CollectTarget, Defaulter } from "../types";

const DefaultersTab = ({ onCollect }: { onCollect?: (target?: CollectTarget) => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const classes = useClasses();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const defaulters = useApiQuery<Defaulter[]>(["fees", "defaulters"], "fees/defaulters", {
    classId: sectionId ? undefined : classId || undefined,
    sectionId: sectionId || undefined,
  });

  const rows = defaulters.data ?? [];
  const totalOverdue = rows.reduce((sum, d) => sum + Math.round(d.overdueAmount * 100), 0);

  const columns = useMemo<ColumnDef<Defaulter>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <p className="text-sm font-bold text-gray-900">{row.original.name}</p>
            <p className="text-xs text-gray-500">{row.original.admissionNumber}</p>
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-gray-600">{row.original.sectionLabel ?? "—"}</span>,
      },
      {
        id: "overdue",
        header: "Overdue",
        cell: ({ row }) => (
          <div>
            <p className="whitespace-nowrap text-sm font-bold text-red-600">{formatCurrency(row.original.overdueAmount, currency)}</p>
            <p className="text-[11px] text-gray-500">
              {row.original.overdueInvoices} invoice{row.original.overdueInvoices === 1 ? "" : "s"}
            </p>
          </div>
        ),
      },
      {
        id: "since",
        header: "Oldest Due",
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-gray-600">{formatDate(row.original.oldestDueDate)}</span>,
      },
      {
        id: "days",
        header: "Days Overdue",
        cell: ({ row }) => (
          <span className={`text-sm font-bold ${row.original.daysOverdue > 30 ? "text-red-600" : "text-amber-600"}`}>
            {row.original.daysOverdue}
          </span>
        ),
      },
      {
        id: "guardian",
        header: "Guardian",
        cell: ({ row }) => (
          <div className="min-w-[130px] text-sm">
            <p className="font-semibold text-gray-800">
              {row.original.guardianName ?? "—"}
              {row.original.guardianRelationship && (
                <span className="ml-1 text-xs font-normal text-gray-500">({row.original.guardianRelationship})</span>
              )}
            </p>
            {row.original.guardianPhone && (
              <a
                href={`tel:${row.original.guardianPhone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C263A] hover:underline"
              >
                <Phone className="h-3 w-3" /> {row.original.guardianPhone}
              </a>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) =>
          onCollect ? (
            <Button
              size="sm"
              onClick={() =>
                onCollect({
                  student: {
                    id: row.original.studentId,
                    name: row.original.name,
                    admissionNumber: row.original.admissionNumber,
                    sectionLabel: row.original.sectionLabel,
                  },
                })
              }
            >
              <Wallet className="h-3.5 w-3.5" /> Collect
            </Button>
          ) : null,
      },
    ],
    [currency, onCollect],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select
            aria-label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All classes"
          />
          <Select
            aria-label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            options={(classes.data?.find((c) => c.id === classId)?.sections ?? []).map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
            placeholder={classId ? "All sections" : "Pick a class first"}
            disabled={!classId}
          />
        </div>
        {rows.length > 0 && (
          <p className="text-sm text-gray-600">
            {rows.length} student{rows.length === 1 ? "" : "s"} ·{" "}
            <span className="font-bold text-red-600">{formatCurrency(totalOverdue / 100, currency)}</span> overdue
          </p>
        )}
      </div>

      <QueryState
        isLoading={defaulters.isLoading}
        error={defaulters.error}
        onRetry={() => defaulters.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title="No defaulters"
            description="Every student is up to date — no invoices are past their due date with a balance."
          />
        }
      >
        <DataTable columns={columns} data={rows} />
      </QueryState>
    </div>
  );
};

export default DefaultersTab;
