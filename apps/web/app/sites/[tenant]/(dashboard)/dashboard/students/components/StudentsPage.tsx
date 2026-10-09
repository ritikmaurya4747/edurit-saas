"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, GraduationCap, Phone, UserPlus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, EmptyState, PageHeader, Pagination, QueryState, SearchInput, Select } from "@/components/ui";
import { useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useClasses, useSections } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { humanize } from "@/lib/utils/format";
import { ageFrom, STATUS_OPTIONS, STATUS_TONE, type StudentListItem } from "../types";
import AdmitStudentModal from "./AdmitStudentModal";
import EditStudentModal from "./EditStudentModal";
import PromoteModal from "./PromoteModal";

const PAGE_SIZE = 20;

const StudentsPage = () => {
  const can = useCan();
  const router = useRouter();
  const canCreate = can(PERMISSIONS.STUDENT_CREATE);
  const canUpdate = can(PERMISSIONS.STUDENT_UPDATE);

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim());
  const classes = useClasses();
  const sections = useSections();

  const students = usePaginatedQuery<StudentListItem>(["students", "list"], "students", {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    status,
  });

  const selectedClass = classes.data?.find((c) => c.id === classId);
  const hasFilters = !!(debouncedSearch || classId || sectionId || status !== "ACTIVE");
  const noSections = !sections.isLoading && (sections.data?.length ?? 0) === 0;

  const columns = useMemo<ColumnDef<StudentListItem>[]>(
    () => [
      {
        accessorKey: "admissionNumber",
        header: "Adm. No",
        cell: ({ row }) => <span className="text-xs font-bold text-gray-500">{row.original.admissionNumber}</span>,
      },
      {
        id: "name",
        header: "Student",
        cell: ({ row }) => {
          const s = row.original;
          const age = ageFrom(s.dob);
          return (
            <Link href={`/dashboard/students/${s.id}`} className="group block min-w-35">
              <span className="font-bold text-gray-900 group-hover:underline">{s.name}</span>
              <span className="block text-xs text-gray-500">
                {humanize(s.gender)}
                {age !== null && ` · ${age} yrs`}
              </span>
            </Link>
          );
        },
      },
      {
        id: "class",
        header: "Class",
        cell: ({ row }) =>
          row.original.enrollment ? (
            <span className="font-semibold text-gray-800">{row.original.enrollment.sectionLabel}</span>
          ) : (
            <span className="text-xs text-gray-400">Not enrolled</span>
          ),
      },
      {
        id: "roll",
        header: "Roll",
        cell: ({ row }) => <span className="font-bold">{row.original.enrollment?.rollNumber ?? "—"}</span>,
      },
      {
        id: "guardian",
        header: "Guardian",
        cell: ({ row }) => {
          const g = row.original.primaryGuardian;
          if (!g) return <span className="text-xs text-gray-400">—</span>;
          return (
            <div className="min-w-35">
              <span className="font-semibold text-gray-800">{g.name}</span>
              <span className="ml-1 text-xs text-gray-400">({humanize(g.relationship)})</span>
              {g.phone && (
                <a href={`tel:${g.phone}`} className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
                  <Phone className="h-3 w-3" /> {g.phone}
                </a>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{humanize(row.original.status)}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/students/${row.original.id}`)}>
              View
            </Button>
            {canUpdate && (
              <Button variant="ghost" size="sm" onClick={() => setEditId(row.original.id)}>
                Edit
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, router],
  );

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Admissions, class enrollment, guardians and student profiles"
        actions={
          <>
            {canUpdate && (
              <Button variant="secondary" onClick={() => setPromoteOpen(true)}>
                <ArrowUpRight className="h-4 w-4" /> Promote
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => setAdmitOpen(true)}>
                <UserPlus className="h-4 w-4" /> Admit Student
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr]">
        <SearchInput
          value={search}
          onChange={resetPage(setSearch)}
          placeholder="Search name, admission no or phone…"
          className="sm:col-span-2 lg:col-span-1"
        />
        <Select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSectionId("");
            setPage(1);
          }}
          options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All classes"
          aria-label="Class"
        />
        <Select
          value={sectionId}
          onChange={(e) => resetPage(setSectionId)(e.target.value)}
          options={(selectedClass?.sections ?? []).map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
          placeholder={selectedClass ? "All sections" : "Pick a class first"}
          disabled={!selectedClass}
          aria-label="Section"
        />
        <Select
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value)}
          options={[...STATUS_OPTIONS, { value: "ALL", label: "All statuses" }]}
          aria-label="Status"
        />
      </div>

      <QueryState
        isLoading={students.isLoading}
        error={students.error}
        onRetry={() => students.refetch()}
        isEmpty={!hasFilters && (students.data?.meta.total ?? 0) === 0}
        empty={
          <EmptyState
            title="No students yet"
            description={
              noSections
                ? "Start by creating classes and sections in Academic Setup, then admit your first student."
                : "Admit your first student to enrol them in a class and section."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {noSections && (
                  <Button variant="secondary" onClick={() => router.push("/dashboard/academics")}>
                    <GraduationCap className="h-4 w-4" /> Academic Setup
                  </Button>
                )}
                {canCreate && !noSections && (
                  <Button onClick={() => setAdmitOpen(true)}>
                    <UserPlus className="h-4 w-4" /> Admit Student
                  </Button>
                )}
              </div>
            }
          />
        }
      >
        <div className={students.isFetching ? "opacity-70 transition-opacity" : undefined}>
          <DataTable columns={columns} data={students.data?.data ?? []} />
        </div>
        <Pagination meta={students.data?.meta} onPageChange={setPage} />
      </QueryState>

      <AdmitStudentModal
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        onAdmitted={(s) => router.push(`/dashboard/students/${s.id}`)}
      />
      <PromoteModal open={promoteOpen} onClose={() => setPromoteOpen(false)} />
      <EditStudentModal studentId={editId} onClose={() => setEditId(null)} />
    </div>
  );
};

export default StudentsPage;
