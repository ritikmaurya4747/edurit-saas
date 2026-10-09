"use client";

import { useState } from "react";
import { Bus, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, Checkbox, ConfirmDialog, EmptyState, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import RouteFormModal from "./RouteFormModal";
import RouteDetailModal from "./RouteDetailModal";
import { TRANSPORT_KEYS, formatClock, telHref, type TransportRoute } from "./types";

const RoutesTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.TRANSPORT_MANAGE);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<TransportRoute | "new" | null>(null);
  const [viewing, setViewing] = useState<TransportRoute | null>(null);
  const [toDelete, setToDelete] = useState<TransportRoute | null>(null);

  const routes = useApiQuery<TransportRoute[]>(["transport", "routes"], "transport/routes", {
    includeInactive: includeInactive || undefined,
  });
  const remove = useApiMutation((id: string) => api.delete(`transport/routes/${id}`), {
    invalidate: TRANSPORT_KEYS,
    success: "Route deleted",
    onSuccess: () => setToDelete(null),
  });

  const rows = routes.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Checkbox label="Show inactive routes" checked={includeInactive} onChange={setIncludeInactive} />
        {canManage && (
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> New route
          </Button>
        )}
      </div>

      <QueryState
        isLoading={routes.isLoading}
        error={routes.error}
        onRetry={() => routes.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title="No routes yet"
            description="Create a route with its stops, pickup / drop times and monthly fee, then assign a vehicle and students."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setEditing("new")}>
                  <Plus className="h-4 w-4" /> New route
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              canManage={canManage}
              onView={() => setViewing(route)}
              onEdit={() => setEditing(route)}
              onDelete={() => setToDelete(route)}
            />
          ))}
        </div>
      </QueryState>

      {editing && <RouteFormModal route={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {viewing && <RouteDetailModal routeId={viewing.id} title={`${viewing.code} · ${viewing.name}`} onClose={() => setViewing(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete route ${toDelete?.code}?`}
        message={
          toDelete?.activeStudents
            ? `${toDelete.activeStudents} student(s) are still assigned. End their assignments before deleting this route.`
            : "The route and its stops are removed. Past assignments stay in the students' history."
        }
        confirmLabel="Delete"
      />
    </div>
  );
};

const RouteCard = ({
  route,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  route: TransportRoute;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const { occupancy, vehicle } = route;
  const percent = occupancy.percent ?? 0;
  const barColor = percent >= 100 ? "bg-red-500" : percent >= 85 ? "bg-amber-500" : "bg-green-500";

  return (
    <Card className={cn("flex flex-col p-4", !route.isActive && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{route.code}</Badge>
            {!route.isActive && <Badge tone="gray">Inactive</Badge>}
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-gray-900">{route.name}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium text-gray-500">Fee per month</p>
          <p className="font-serif text-lg font-bold text-[#1C263A]">{formatCurrency(route.monthlyFee, currency)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
        {vehicle ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Bus className="h-4 w-4 text-gray-500" /> {vehicle.registrationNumber}
              {vehicle.model && <span className="text-xs font-normal text-gray-500">{vehicle.model}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
              <span>Driver: {vehicle.driverName}</span>
              <a href={telHref(vehicle.driverPhone)} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">
                <Phone className="h-3 w-3" /> {vehicle.driverPhone}
              </a>
            </div>
            {vehicle.helperName && (
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-600">
                <span>Helper: {vehicle.helperName}</span>
                {vehicle.helperPhone && (
                  <a href={telHref(vehicle.helperPhone)} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                    <Phone className="h-3 w-3" /> {vehicle.helperPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-700">No vehicle assigned{canManage ? " — edit the route to choose one." : "."}</p>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">
            {occupancy.used} student{occupancy.used === 1 ? "" : "s"}
            {occupancy.capacity !== null && <span className="font-normal text-gray-500"> of {occupancy.capacity} seats</span>}
          </span>
          {occupancy.percent !== null && <span className="font-bold text-gray-700">{occupancy.percent}%</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 flex-1">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Stops ({route.stops.length})</p>
        {route.stops.length === 0 ? (
          <p className="text-xs text-gray-400">No stops added yet.</p>
        ) : (
          <ol className="relative ml-1.5 border-l-2 border-gray-200">
            {route.stops.map((stop) => (
              <li key={stop.id} className="relative pb-2.5 pl-4 last:pb-0">
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#1C263A]" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{stop.name}</p>
                    <p className="text-[11px] text-gray-500">
                      Pickup {formatClock(stop.pickupTime)} · Drop {formatClock(stop.dropTime)}
                      {stop.fee != null && <> · {formatCurrency(stop.fee, currency)}/month</>}
                    </p>
                  </div>
                  {stop.studentCount > 0 && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{stop.studentCount}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
        <Button variant="outline" size="sm" onClick={onView}>
          <Users className="h-3.5 w-3.5" /> Students
        </Button>
        {canManage && (
          <>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Delete route">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default RoutesTab;
