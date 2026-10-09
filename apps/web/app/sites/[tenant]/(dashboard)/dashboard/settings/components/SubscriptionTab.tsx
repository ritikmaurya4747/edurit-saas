"use client";

import { Badge, Card, EmptyState, StatTile, type BadgeTone } from "@/components/ui";
import { formatDate, formatNumber, humanize } from "@/lib/utils/format";
import type { SchoolSettings, SubscriptionStatus } from "./types";

const statusTone: Record<SubscriptionStatus, BadgeTone> = {
  TRIAL: "yellow",
  ACTIVE: "green",
  PAST_DUE: "red",
  CANCELLED: "gray",
};

const UsageBar = ({ label, used, limit }: { label: string; used: number; limit: number }) => {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 100 ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-[#1C263A]";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">
          {formatNumber(used)} <span className="font-medium text-gray-400">/ {limit > 0 ? formatNumber(limit) : "Unlimited"}</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label={`${label} usage`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {limit > 0 && pct >= 85 && (
        <p className={`mt-1 text-[11px] ${pct >= 100 ? "text-red-600" : "text-amber-700"}`}>
          {pct >= 100 ? "Plan limit reached — contact EduRit to upgrade." : `${pct}% of your plan limit used.`}
        </p>
      )}
    </div>
  );
};

const SubscriptionTab = ({ data }: { data: SchoolSettings }) => {
  const sub = data.subscription;

  return (
    <div className="space-y-5">
      {sub ? (
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current plan</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-gray-900">{sub.planName}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                {sub.autoRenew ? " · Auto-renews" : ""}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge tone={statusTone[sub.status] ?? "gray"}>{humanize(sub.status)}</Badge>
              <p className={`text-sm font-bold ${sub.daysRemaining <= 15 ? "text-red-600" : "text-gray-900"}`}>
                {sub.daysRemaining > 0 ? `${sub.daysRemaining} days remaining` : "Expired"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <UsageBar label="Active students" used={data.usage.students} limit={sub.maxStudents} />
            <UsageBar label="Active staff" used={data.usage.staff} limit={sub.maxStaff} />
          </div>

          {(sub.status === "PAST_DUE" || sub.daysRemaining <= 15) && (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {sub.status === "PAST_DUE"
                ? "Your subscription payment is overdue. Please contact EduRit support to avoid interruption."
                : "Your subscription ends soon. Contact EduRit support to renew."}
            </p>
          )}
        </Card>
      ) : (
        <EmptyState
          title="No subscription on record"
          description="Contact EduRit support to activate a plan for your school."
        />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Active students" value={formatNumber(data.usage.students)} />
        <StatTile label="Active staff" value={formatNumber(data.usage.staff)} />
        <StatTile label="Branches" value={formatNumber(data.usage.branches)} />
        <StatTile label="Classes" value={formatNumber(data.usage.classes)} />
      </div>
    </div>
  );
};

export default SubscriptionTab;
