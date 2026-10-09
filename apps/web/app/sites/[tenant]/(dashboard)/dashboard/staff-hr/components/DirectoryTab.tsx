"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, EmptyState, Pagination, QueryState, SearchInput, Select } from "@/components/ui";
import { useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import type { StaffItem } from "../types";
import { PersonCell, STAFF_STATUS_OPTIONS, StaffStatusBadge } from "./shared";

interface Props {
  onAdd: () => void;
  onView: (id: string) => void;
}

export default function DirectoryTab({ onAdd, onView }: Props) {
  const can = useCan();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search.trim());

  const departments = useApiQuery<string[]>(["staff", "departments"], "staff/departments");
  const list = usePaginatedQuery<StaffItem>(["staff", "list"], "staff", {
    page,
    limit: 20,
    search: debounced,
    department,
    status,
    isTeachingStaff: type === "" ? undefined : type === "teaching",
  });

  const filtered = !!(debounced || department || status || type);
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<StaffItem>[]>(
    () => [
      {
        accessorKey: "employeeCode",
        header: "Emp ID",
        cell: ({ row }) => <span className="text-xs font-bold uppercase text-gray-500">{row.original.employeeCode}</span>,
      },
      {
        accessorKey: "name",
        header: "Staff name",
        cell: ({ row }) => (
          <button type="button" onClick={() => onView(row.original.id)} className="cursor-pointer text-left hover:underline">
            <PersonCell name={row.original.name} sub={row.original.email} />
          </button>
        ),
      },
      {
        accessorKey: "designation",
        header: "Designation",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-gray-800">{row.original.designation || "—"}</p>
            <p className="text-xs text-gray-400">{row.original.isTeachingStaff ? "Teaching" : "Non-teaching"}</p>
          </div>
        ),
      },
      { accessorKey: "department", header: "Department", cell: ({ row }) => <span className="text-gray-600">{row.original.department || "—"}</span> },
      {
        id: "roles",
        header: "Role",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length ? (
              row.original.roles.map((r) => (
                <Badge key={r.code} tone="purple">
                  {r.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">No access</span>
            )}
          </div>
        ),
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StaffStatusBadge status={row.original.status} /> },
      { accessorKey: "joiningDate", header: "Joined", cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.joiningDate)}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => onView(row.original.id)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [onView],
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search name, email, phone, emp ID…" />
        <Select
          value={department}
          onChange={(e) => resetPage(setDepartment)(e.target.value)}
          placeholder="All departments"
          options={(departments.data ?? []).map((d) => ({ value: d, label: d }))}
        />
        <Select value={status} onChange={(e) => resetPage(setStatus)(e.target.value)} placeholder="All statuses" options={STAFF_STATUS_OPTIONS} />
        <Select
          value={type}
          onChange={(e) => resetPage(setType)(e.target.value)}
          placeholder="Teaching & non-teaching"
          options={[
            { value: "teaching", label: "Teaching staff" },
            { value: "non-teaching", label: "Non-teaching staff" },
          ]}
        />
      </div>

      <QueryState
        isLoading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        isEmpty={!list.data?.data.length}
        empty={
          filtered ? (
            <EmptyState title="No staff match these filters" description="Try a different search or clear the filters." />
          ) : (
            <EmptyState
              title="No staff members yet"
              description="Add your teachers and support staff to manage their attendance, leave and payroll."
              action={
                can(PERMISSIONS.STAFF_CREATE) && (
                  <Button onClick={onAdd}>
                    <Plus className="h-4 w-4" /> Add Staff
                  </Button>
                )
              }
            />
          )
        }
      >
        <DataTable columns={columns} data={list.data?.data ?? []} />
        <Pagination meta={list.data?.meta} onPageChange={setPage} />
      </QueryState>
    </div>
  );
}
