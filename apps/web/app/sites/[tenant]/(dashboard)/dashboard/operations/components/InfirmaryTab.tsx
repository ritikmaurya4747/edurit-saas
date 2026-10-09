"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Button,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  QueryState,
  SearchInput,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useStudentOptions } from "@/lib/api/lookups";
import type { StudentOption } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, formatTime, todayInput } from "@/lib/utils/format";
import { OPS_KEYS, type InfirmaryVisit } from "./types";

const daysAgoInput = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};

const InfirmaryTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.OPERATIONS_MANAGE);

  const [from, setFrom] = useState(daysAgoInput(30));
  const [to, setTo] = useState(todayInput());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [logOpen, setLogOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const visits = usePaginatedQuery<InfirmaryVisit>(["operations", "infirmary"], "infirmary-visits", {
    from: from || undefined,
    to: to || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 20,
  });

  const columns = useMemo<ColumnDef<InfirmaryVisit>[]>(
    () => [
      {
        accessorKey: "visitedAt",
        header: "When",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold text-gray-800">{formatDate(row.original.visitedAt)}</span>
            <span className="text-xs text-gray-500">{formatTime(row.original.visitedAt)}</span>
          </div>
        ),
      },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{row.original.student.name}</span>
            <span className="text-xs text-gray-500">Adm. {row.original.student.admissionNumber}</span>
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: ({ row }) => <span className="whitespace-nowrap text-gray-700">{row.original.student.sectionLabel ?? "—"}</span>,
      },
      {
        accessorKey: "complaint",
        header: "Complaint",
        cell: ({ row }) => <p className="min-w-40 max-w-xs whitespace-pre-line text-gray-700">{row.original.complaint}</p>,
      },
      {
        accessorKey: "treatment",
        header: "Treatment",
        cell: ({ row }) => <p className="min-w-40 max-w-xs whitespace-pre-line text-gray-700">{row.original.treatment}</p>,
      },
    ],
    [],
  );

  const rows = visits.data?.data ?? [];
  const resetPage = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[160px_160px_260px]">
          <Field label="From">
            <Input type="date" value={from} max={to || undefined} onChange={(e) => resetPage(() => setFrom(e.target.value))} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} min={from || undefined} onChange={(e) => resetPage(() => setTo(e.target.value))} />
          </Field>
          <Field label="Search" className="col-span-2 sm:col-span-1">
            <SearchInput value={search} onChange={(v) => resetPage(() => setSearch(v))} placeholder="Student or complaint…" />
          </Field>
        </div>
        {canManage && (
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4" /> Log visit
          </Button>
        )}
      </div>

      <QueryState
        isLoading={visits.isLoading}
        error={visits.error}
        onRetry={() => visits.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title="No infirmary visits"
            description="No student visits were logged in this period."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setLogOpen(true)}>
                  <Plus className="h-4 w-4" /> Log visit
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
        <Pagination meta={visits.data?.meta} onPageChange={setPage} />
      </QueryState>

      {logOpen && <LogVisitModal onClose={() => setLogOpen(false)} />}
    </div>
  );
};

// datetime-local value for "now" in the browser's timezone.
const nowLocalInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const LogVisitModal = ({ onClose }: { onClose: () => void }) => {
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [complaint, setComplaint] = useState("");
  const [treatment, setTreatment] = useState("");
  const [visitedAt, setVisitedAt] = useState(nowLocalInput());
  const debounced = useDebounce(studentSearch.trim());

  // Only search once at least 2 characters are typed (null keeps the query idle).
  const options = useStudentOptions(debounced.length >= 2 && !student ? undefined : null, debounced);

  const save = useApiMutation(
    (body: { studentId: string; complaint: string; treatment: string; visitedAt?: string }) => api.post("infirmary-visits", body),
    { invalidate: OPS_KEYS, success: "Infirmary visit logged", onSuccess: onClose },
  );

  const submit = () => {
    if (!student) return;
    save.mutate({
      studentId: student.id,
      complaint: complaint.trim(),
      treatment: treatment.trim(),
      visitedAt: visitedAt ? new Date(visitedAt).toISOString() : undefined,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Log infirmary visit"
      description="Record a student's visit to the school infirmary."
      size="lg"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!student}>
            Save visit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Student" required>
          {student ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{student.name}</p>
                <p className="text-xs text-gray-500">
                  Adm. {student.admissionNumber}
                  {student.sectionLabel && <> · {student.sectionLabel}</>}
                  {student.rollNumber != null && <> · Roll {student.rollNumber}</>}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                <X className="h-3.5 w-3.5" /> Change
              </Button>
            </div>
          ) : (
            <div>
              <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Type a name or admission number…" />
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200">
                {debounced.length < 2 ? (
                  <p className="px-3 py-4 text-center text-xs text-gray-500">Type at least 2 characters to find a student.</p>
                ) : options.isLoading ? (
                  <LoadingState label="Searching…" className="py-6" />
                ) : options.error ? (
                  <p className="px-3 py-4 text-center text-xs text-red-600">{options.error.message}</p>
                ) : (options.data ?? []).length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-gray-500">No active students match “{debounced}”.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {(options.data ?? []).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setStudent(s)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="truncate text-sm font-semibold text-gray-900">{s.name}</span>
                          <span className="shrink-0 text-xs text-gray-500">
                            {s.sectionLabel ?? "—"} · {s.admissionNumber}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Field>
        <Field label="Complaint / symptoms" required>
          <Textarea required rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="e.g. Headache and mild fever" />
        </Field>
        <Field label="Treatment given" required>
          <Textarea
            required
            rows={3}
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="e.g. Rested for 30 minutes, parent informed"
          />
        </Field>
        <Field label="Visit time" hint="Defaults to now">
          <Input type="datetime-local" value={visitedAt} max={nowLocalInput()} onChange={(e) => setVisitedAt(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};

export default InfirmaryTab;
