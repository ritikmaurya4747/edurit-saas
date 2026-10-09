"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  QueryState,
  SearchInput,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import type { StudentOption } from "@/lib/api/types";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate, todayInput } from "@/lib/utils/format";
import StudentPicker from "./StudentPicker";
import { TRANSPORT_KEYS, formatClock, telHref, type Assignment, type TransportRoute } from "./types";

const AssignmentsTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.TRANSPORT_MANAGE);
  const user = useUser();
  const currency = user?.currency ?? "INR";

  const [routeId, setRouteId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState(false);
  const [ending, setEnding] = useState<Assignment | null>(null);
  const debouncedSearch = useDebounce(search);

  const routes = useApiQuery<TransportRoute[]>(["transport", "routes"], "transport/routes", {});
  const sections = useSections();
  const assignments = usePaginatedQuery<Assignment>(["transport", "assignments"], "transport/assignments", {
    routeId: routeId || undefined,
    sectionId: sectionId || undefined,
    search: debouncedSearch.trim() || undefined,
    includeInactive: includeInactive || undefined,
    page,
    limit: 20,
  });

  const columns = useMemo<ColumnDef<Assignment>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-bold text-gray-900">{row.original.student.name}</span>
            <span className="text-xs text-gray-500">
              Adm. {row.original.student.admissionNumber}
              {row.original.student.sectionLabel && <> · {row.original.student.sectionLabel}</>}
            </span>
          </div>
        ),
      },
      {
        id: "route",
        header: "Route",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold text-gray-900">
              <Badge tone="blue" className="mr-1.5">
                {row.original.route.code}
              </Badge>
              {row.original.route.name}
            </span>
            {row.original.route.vehicle && (
              <span className="mt-0.5 text-xs text-gray-500">{row.original.route.vehicle.registrationNumber}</span>
            )}
          </div>
        ),
      },
      {
        id: "stop",
        header: "Stop",
        cell: ({ row }) =>
          row.original.stop ? (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-semibold text-gray-800">{row.original.stop.name}</span>
              <span className="text-xs text-gray-500">
                {formatClock(row.original.stop.pickupTime)} / {formatClock(row.original.stop.dropTime)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not set</span>
          ),
      },
      {
        id: "fee",
        header: "Fee / month",
        cell: ({ row }) => <span className="whitespace-nowrap font-bold text-gray-900">{formatCurrency(row.original.monthlyFee, currency)}</span>,
      },
      {
        id: "guardian",
        header: "Guardian phone",
        cell: ({ row }) =>
          row.original.student.guardianPhone ? (
            <a href={telHref(row.original.student.guardianPhone)} className="whitespace-nowrap font-semibold text-blue-700 hover:underline">
              {row.original.student.guardianPhone}
            </a>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        id: "period",
        header: "Period",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap text-xs">
            <span className="font-semibold text-gray-800">From {formatDate(row.original.startDate)}</span>
            {row.original.endDate ? (
              <span className="text-gray-500">To {formatDate(row.original.endDate)}</span>
            ) : (
              <Badge tone="green" className="mt-1 w-fit">
                Active
              </Badge>
            )}
          </div>
        ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) =>
                row.original.isActive ? (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEnding(row.original)}>
                      End
                    </Button>
                  </div>
                ) : null,
            } satisfies ColumnDef<Assignment>,
          ]
        : []),
    ],
    [canManage, currency],
  );

  const rows = assignments.data?.data ?? [];
  const hasFilters = !!(routeId || sectionId || debouncedSearch.trim());
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
          <SearchInput className="lg:w-64" value={search} onChange={resetPage(setSearch)} placeholder="Search student or admission no…" />
          <Select
            className="lg:w-52"
            value={routeId}
            onChange={(e) => resetPage(setRouteId)(e.target.value)}
            options={(routes.data ?? []).map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))}
            placeholder="All routes"
          />
          <Select
            className="lg:w-44"
            value={sectionId}
            onChange={(e) => resetPage(setSectionId)(e.target.value)}
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
            placeholder="All classes"
          />
          <Checkbox label="Include ended" checked={includeInactive} onChange={resetPage(setIncludeInactive)} />
        </div>
        {canManage && (
          <Button onClick={() => setAssigning(true)}>
            <Plus className="h-4 w-4" /> Assign student
          </Button>
        )}
      </div>

      <QueryState
        isLoading={assignments.isLoading}
        error={assignments.error}
        onRetry={() => assignments.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No assignments match" : "No students assigned to transport yet"}
            description={hasFilters ? "Try another route, class or search." : "Assign students to a route and boarding stop to build each bus list."}
            action={
              !hasFilters && canManage ? (
                <Button size="sm" onClick={() => setAssigning(true)}>
                  <Plus className="h-4 w-4" /> Assign student
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
        <Pagination meta={assignments.data?.meta} onPageChange={setPage} />
      </QueryState>

      {assigning && <AssignModal routes={routes.data ?? []} onClose={() => setAssigning(false)} />}
      {ending && <EndModal assignment={ending} onClose={() => setEnding(null)} />}
    </div>
  );
};

interface StudentTransportInfo {
  current: Assignment | null;
}

const AssignModal = ({ routes, onClose }: { routes: TransportRoute[]; onClose: () => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");
  const [startDate, setStartDate] = useState(todayInput());

  const current = useApiQuery<StudentTransportInfo>(
    ["transport", "student", student?.id],
    student ? `transport/students/${student.id}` : null,
  );
  const activeRoutes = routes.filter((r) => r.isActive);
  const route = activeRoutes.find((r) => r.id === routeId);
  const stop = route?.stops.find((s) => s.id === stopId);
  const isFull = !!route && route.occupancy.capacity !== null && route.occupancy.used >= route.occupancy.capacity;
  const fee = stop?.fee != null ? stop.fee : route?.monthlyFee;

  const save = useApiMutation(
    () =>
      api.post("transport/assignments", {
        studentId: student!.id,
        routeId,
        ...(stopId && { stopId }),
        ...(startDate && { startDate }),
      }),
    { invalidate: TRANSPORT_KEYS, success: "Student assigned", onSuccess: onClose },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Assign student to transport"
      description="A student has one active route at a time — assigning again moves them and closes the previous assignment."
      size="lg"
      onSubmit={() => student && routeId && save.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!student || !routeId}>
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-700">
            Student<span className="ml-0.5 text-red-500">*</span>
          </p>
          <StudentPicker value={student} onChange={setStudent} />
          {current.data?.current && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Currently on route <span className="font-bold">{current.data.current.route.code}</span>
              {current.data.current.stop && <> at {current.data.current.stop.name}</>} since {formatDate(current.data.current.startDate)}.
              Saving will end that assignment today.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Route" required hint={activeRoutes.length ? undefined : "Create a route first"}>
            <Select
              required
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                setStopId("");
              }}
              options={activeRoutes.map((r) => ({
                value: r.id,
                label: `${r.code} · ${r.name}${r.occupancy.capacity !== null ? ` (${r.occupancy.used}/${r.occupancy.capacity})` : ""}`,
              }))}
              placeholder="Choose a route"
            />
          </Field>
          <Field label="Boarding stop" hint={route && !route.stops.length ? "This route has no stops yet" : undefined}>
            <Select
              value={stopId}
              onChange={(e) => setStopId(e.target.value)}
              disabled={!route || !route.stops.length}
              options={(route?.stops ?? []).map((s) => ({
                value: s.id,
                label: `${s.sequence}. ${s.name}${s.pickupTime ? ` · ${formatClock(s.pickupTime)}` : ""}`,
              }))}
              placeholder="Choose a stop"
            />
          </Field>
          <Field label="Start date" required>
            <Input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          {route && (
            <div className="flex flex-col justify-end rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-[11px] text-gray-500">Fee per month</span>
              <span className="font-bold text-gray-900">{formatCurrency(fee, currency)}</span>
              <span className="text-[11px] text-gray-400">For the accounts team — no invoice is created</span>
            </div>
          )}
        </div>
        {isFull && (
          <p className="text-xs font-semibold text-red-600">
            This route&apos;s vehicle is full ({route?.occupancy.used}/{route?.occupancy.capacity}). Choose a bigger vehicle or another route.
          </p>
        )}
      </div>
    </Modal>
  );
};

const EndModal = ({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) => {
  const [endDate, setEndDate] = useState(todayInput());
  const end = useApiMutation(() => api.post(`transport/assignments/${assignment.id}/end`, { endDate }), {
    invalidate: TRANSPORT_KEYS,
    success: "Transport assignment ended",
    onSuccess: onClose,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="End transport assignment"
      description={`${assignment.student.name} · ${assignment.route.code} ${assignment.route.name}`}
      size="sm"
      onSubmit={() => end.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={end.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={end.isPending}>
            End assignment
          </Button>
        </>
      }
    >
      <Field label="Last day of transport" required hint={`Started on ${formatDate(assignment.startDate)}`}>
        <Input
          required
          type="date"
          min={assignment.startDate.slice(0, 10)}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          autoFocus
        />
      </Field>
    </Modal>
  );
};

export default AssignmentsTab;
