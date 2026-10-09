"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, StatTile, Tabs } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatDate, formatNumber } from "@/lib/utils/format";
import RoutesTab from "./RoutesTab";
import VehiclesTab from "./VehiclesTab";
import AssignmentsTab from "./AssignmentsTab";
import type { TransportSummary } from "./types";

type TabId = "routes" | "vehicles" | "assignments";

const TransportPage = () => {
  const [tab, setTab] = useState<TabId>("routes");
  const summary = useApiQuery<TransportSummary>(["transport", "summary"], "transport/summary");
  const s = summary.data;
  const value = (n?: number) => (summary.isLoading ? "…" : summary.error ? "—" : formatNumber(n ?? 0));
  const expiring = s?.expiringDocuments ?? [];

  return (
    <div>
      <PageHeader title="Transport" description="Routes, stops, vehicles and the students who ride them" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Active vehicles" value={value(s?.vehicles)} hint={s ? `${formatNumber(s.capacity)} seats in total` : undefined} />
        <StatTile label="Active routes" value={value(s?.routes)} hint="Running this term" />
        <StatTile label="Students using transport" value={value(s?.studentsUsingTransport)} hint="Active assignments" />
        <StatTile
          label="Seat occupancy"
          value={summary.isLoading ? "…" : summary.error ? "—" : `${s?.occupancyPercent ?? 0}%`}
          hint="Riders vs. fleet capacity"
          tone={s && s.occupancyPercent >= 95 ? "warning" : "default"}
        />
        <StatTile
          label="Vehicle documents"
          value={value(expiring.length)}
          hint={s?.expiredDocuments ? `${s.expiredDocuments} already expired` : "Expiring within 30 days"}
          tone={s?.expiredDocuments ? "danger" : expiring.length ? "warning" : "success"}
        />
      </div>

      {expiring.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="font-bold">Vehicle documents need renewal</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {expiring.slice(0, 6).map((d) => (
                <li key={`${d.vehicleId}-${d.document}`}>
                  <span className="font-semibold">{d.registrationNumber}</span> —{" "}
                  {d.document === "INSURANCE" ? "Insurance" : "Fitness certificate"}{" "}
                  {d.expired ? (
                    <span className="font-bold text-red-700">expired on {formatDate(d.expiryDate)}</span>
                  ) : (
                    <>
                      expires on {formatDate(d.expiryDate)} ({d.daysLeft === 0 ? "today" : `${d.daysLeft} days`})
                    </>
                  )}
                </li>
              ))}
              {expiring.length > 6 && <li>…and {expiring.length - 6} more (see the Vehicles tab)</li>}
            </ul>
          </div>
        </div>
      )}

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "routes", label: "Routes", count: s?.routes },
          { id: "vehicles", label: "Vehicles", count: s?.vehicles },
          { id: "assignments", label: "Student Assignments", count: s?.studentsUsingTransport },
        ]}
      />

      {tab === "routes" && <RoutesTab />}
      {tab === "vehicles" && <VehiclesTab />}
      {tab === "assignments" && <AssignmentsTab />}
    </div>
  );
};

export default TransportPage;
