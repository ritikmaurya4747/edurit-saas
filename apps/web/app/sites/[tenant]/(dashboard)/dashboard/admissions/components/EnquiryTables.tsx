"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, EmptyState, QueryState, SearchInput, Select } from "@/components/ui";
import { useApiQuery, useDebounce } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { STAGE_LABEL, STAGE_TONE, sourceLabel, type AdmissionStage, type Enquiry, type EnquiryActions } from "../types";

// ---------- shared columns ----------
const applicantColumn: ColumnDef<Enquiry> = {
  id: "applicant",
  header: "Applicant",
  cell: ({ row }) => (
    <div className="min-w-35">
      <span className="font-bold text-gray-900">{row.original.studentName}</span>
      {row.original.parentName && <span className="block text-xs text-gray-500">{row.original.parentName}</span>}
    </div>
  ),
};

const classColumn: ColumnDef<Enquiry> = {
  accessorKey: "classApplied",
  header: "Class",
  cell: ({ row }) => <span className="font-semibold">{row.original.classApplied}</span>,
};

const phoneColumn: ColumnDef<Enquiry> = {
  accessorKey: "phone",
  header: "Phone",
  cell: ({ row }) => (
    <a href={`tel:${row.original.phone}`} className="whitespace-nowrap text-blue-700 hover:underline">
      {row.original.phone}
    </a>
  ),
};

const createdColumn: ColumnDef<Enquiry> = {
  accessorKey: "createdAt",
  header: "Enquired",
  cell: ({ row }) => <span className="whitespace-nowrap text-xs text-gray-500">{formatDate(row.original.createdAt)}</span>,
};

// ---------- Waitlist ----------
export const WaitlistTab = ({ enquiries, actions }: { enquiries: Enquiry[]; actions: EnquiryActions }) => {
  const rows = enquiries.filter((e) => e.stage === "WAITLISTED");
  const columns = useMemo<ColumnDef<Enquiry>[]>(
    () => [
      applicantColumn,
      classColumn,
      phoneColumn,
      { id: "source", header: "Source", cell: ({ row }) => sourceLabel(row.original.source) },
      createdColumn,
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          actions.canManage && (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={actions.movingId === row.original.id}
                onClick={() => actions.move(row.original, "OFFER_SENT")}
              >
                Move to offer
              </Button>
              {actions.canAdmit && (
                <Button size="sm" variant="outline" onClick={() => actions.admit(row.original)}>
                  Admit
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => actions.reject(row.original)}>
                Reject
              </Button>
            </div>
          ),
      },
    ],
    [actions],
  );

  if (!rows.length) {
    return (
      <EmptyState
        title="Waitlist is empty"
        description="Use the Waitlist action on a pipeline card when a class is full or an applicant is on hold."
      />
    );
  }
  return <DataTable columns={columns} data={rows} />;
};

// ---------- Entrance tests ----------
export const EntranceTestsTab = ({ enquiries, actions }: { enquiries: Enquiry[]; actions: EnquiryActions }) => {
  const rows = enquiries
    .filter((e) => e.stage === "ENTRANCE_TEST")
    .sort((a, b) => (a.testDate ?? "9999").localeCompare(b.testDate ?? "9999"));
  const columns = useMemo<ColumnDef<Enquiry>[]>(
    () => [
      applicantColumn,
      classColumn,
      phoneColumn,
      {
        id: "testDate",
        header: "Test date",
        cell: ({ row }) =>
          row.original.testDate ? (
            <span className="whitespace-nowrap font-semibold">{formatDateTime(row.original.testDate)}</span>
          ) : (
            <Badge tone="yellow">Not scheduled</Badge>
          ),
      },
      {
        id: "testScore",
        header: "Score",
        cell: ({ row }) =>
          row.original.testScore != null ? (
            <span className="font-bold text-gray-900">{Number(row.original.testScore)}</span>
          ) : (
            <span className="text-xs text-gray-400">Pending</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          actions.canManage && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => actions.recordTest(row.original)}>
                {row.original.testDate ? "Update result" : "Schedule"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actions.movingId === row.original.id}
                onClick={() => actions.move(row.original, "OFFER_SENT")}
              >
                Send offer
              </Button>
            </div>
          ),
      },
    ],
    [actions],
  );

  if (!rows.length) {
    return (
      <EmptyState
        title="No entrance tests pending"
        description="Applicants moved to the Entrance Test stage appear here so you can schedule tests and record scores."
      />
    );
  }
  return <DataTable columns={columns} data={rows} />;
};

// ---------- All enquiries (server-side filters) ----------
const STAGE_FILTER = (Object.keys(STAGE_LABEL) as AdmissionStage[]).map((s) => ({ value: s, label: STAGE_LABEL[s] }));

export const AllEnquiriesTab = ({ actions, onCreate }: { actions: EnquiryActions; onCreate: () => void }) => {
  const classes = useClasses();
  const [stage, setStage] = useState("");
  const [classApplied, setClassApplied] = useState("");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim());

  const query = useApiQuery<Enquiry[]>(["admissions", "all"], "admissions", {
    stage: stage || undefined,
    classApplied: classApplied || undefined,
    search: debounced || undefined,
  });
  const filtered = !!(stage || classApplied || debounced);

  const columns = useMemo<ColumnDef<Enquiry>[]>(
    () => [
      applicantColumn,
      classColumn,
      phoneColumn,
      { id: "source", header: "Source", cell: ({ row }) => sourceLabel(row.original.source) },
      {
        id: "stage",
        header: "Stage",
        cell: ({ row }) => <Badge tone={STAGE_TONE[row.original.stage]}>{STAGE_LABEL[row.original.stage]}</Badge>,
      },
      createdColumn,
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const e = row.original;
          if (e.stage === "ADMITTED") {
            return e.studentId ? (
              <div className="flex justify-end">
                <Link href={`/dashboard/students/${e.studentId}`} className="text-xs font-bold text-blue-700 hover:underline">
                  View student
                </Link>
              </div>
            ) : null;
          }
          if (!actions.canManage) return null;
          return (
            <div className="flex justify-end gap-2">
              {e.stage === "REJECTED" ? (
                <Button size="sm" variant="secondary" onClick={() => actions.move(e, "ENQUIRY")}>
                  Reopen
                </Button>
              ) : (
                actions.canAdmit && (
                  <Button size="sm" variant="outline" onClick={() => actions.admit(e)}>
                    Admit
                  </Button>
                )
              )}
              <Button size="sm" variant="ghost" onClick={() => actions.edit(e)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => actions.remove(e)}>
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [actions],
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search student, parent or phone…" />
        <Select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          options={STAGE_FILTER}
          placeholder="All stages"
          aria-label="Stage"
        />
        <Select
          value={classApplied}
          onChange={(e) => setClassApplied(e.target.value)}
          options={(classes.data ?? []).map((c) => ({ value: c.name, label: c.name }))}
          placeholder="All classes"
          aria-label="Class"
        />
      </div>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!filtered && !query.data?.length}
        empty={
          <EmptyState
            title="No enquiries yet"
            description="Record walk-in, phone and website enquiries to track them through admission."
            action={actions.canManage && <Button onClick={onCreate}>New Enquiry</Button>}
          />
        }
      >
        <DataTable columns={columns} data={query.data ?? []} />
        {(query.data?.length ?? 0) >= 500 && (
          <p className="mt-2 text-xs text-gray-400">Showing the 500 most recent enquiries — refine the filters to see older ones.</p>
        )}
      </QueryState>
    </div>
  );
};
