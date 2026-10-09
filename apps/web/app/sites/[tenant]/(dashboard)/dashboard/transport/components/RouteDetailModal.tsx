"use client";

import { Phone } from "lucide-react";
import { Button, EmptyState, Modal, QueryState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { formatClock, telHref, type RouteDetail } from "./types";

// Students riding a route, grouped by their boarding stop.
const RouteDetailModal = ({ routeId, title, onClose }: { routeId: string; title: string; onClose: () => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const detail = useApiQuery<RouteDetail>(["transport", "routes", routeId], `transport/routes/${routeId}`);
  const route = detail.data;
  const assignments = route?.assignments ?? [];

  const groups = route
    ? [
        ...route.stops.map((stop) => ({
          key: stop.id,
          label: stop.name,
          times: `Pickup ${formatClock(stop.pickupTime)} · Drop ${formatClock(stop.dropTime)}`,
          rows: assignments.filter((a) => a.stop?.id === stop.id),
        })),
        { key: "none", label: "No stop chosen", times: "", rows: assignments.filter((a) => !a.stop) },
      ].filter((g) => g.rows.length)
    : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={
        route
          ? `${route.activeStudents} student(s)${route.occupancy.capacity !== null ? ` · ${route.occupancy.capacity} seats` : ""} · ${formatCurrency(route.monthlyFee, currency)} per month`
          : undefined
      }
      size="xl"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <QueryState
        isLoading={detail.isLoading}
        error={detail.error}
        onRetry={() => detail.refetch()}
        isEmpty={assignments.length === 0}
        empty={<EmptyState title="No students on this route" description="Assign students from the Student Assignments tab." />}
      >
        {route?.vehicle && (
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <span className="font-bold text-gray-900">{route.vehicle.registrationNumber}</span>
            <span>Driver: {route.vehicle.driverName}</span>
            <a href={telHref(route.vehicle.driverPhone)} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">
              <Phone className="h-3 w-3" /> {route.vehicle.driverPhone}
            </a>
          </div>
        )}
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-1">
                <h4 className="text-sm font-bold text-gray-900">
                  {group.label} <span className="font-normal text-gray-500">({group.rows.length})</span>
                </h4>
                {group.times && <span className="text-xs text-gray-500">{group.times}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="py-1.5 pr-3 font-semibold">Student</th>
                      <th className="py-1.5 pr-3 font-semibold">Class</th>
                      <th className="py-1.5 pr-3 font-semibold">Guardian phone</th>
                      <th className="py-1.5 font-semibold">Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.rows.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2 pr-3">
                          <p className="font-bold text-gray-900">{a.student.name}</p>
                          <p className="text-xs text-gray-500">Adm. {a.student.admissionNumber}</p>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{a.student.sectionLabel ?? "—"}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {a.student.guardianPhone ? (
                            <a href={telHref(a.student.guardianPhone)} className="font-semibold text-blue-700 hover:underline">
                              {a.student.guardianPhone}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {a.student.guardianName && <p className="text-[11px] text-gray-500">{a.student.guardianName}</p>}
                        </td>
                        <td className="py-2 whitespace-nowrap text-gray-700">{formatDate(a.startDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </QueryState>
    </Modal>
  );
};

export default RouteDetailModal;
