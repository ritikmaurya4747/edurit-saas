"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet } from "lucide-react";
import { Button, Card, EmptyState, QueryState, StatTile } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { CollectTarget, FeeSummary } from "../types";
import { methodLabel } from "../utils";

const compact = (value: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value);

const TrendTooltip = ({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
  currency: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-gray-900">{formatCurrency(Number(payload[0]?.value ?? 0), currency)}</p>
    </div>
  );
};

const OverviewTab = ({
  onCollect,
  onShowDefaulters,
}: {
  onCollect?: (target?: CollectTarget) => void;
  onShowDefaulters: () => void;
}) => {
  const user = useUser();
  const summary = useApiQuery<FeeSummary>(["fees", "summary"], "fees/summary");
  const currency = summary.data?.currency ?? user?.currency ?? "INR";
  const data = summary.data;
  const methodTotal = data?.byMethod.reduce((sum, m) => sum + m.amount, 0) ?? 0;

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error} onRetry={() => summary.refetch()}>
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Collected"
              value={formatCurrency(data.collected, currency)}
              hint={`This month ${formatCurrency(data.monthCollection, currency)} · Today ${formatCurrency(data.todayCollection, currency)}`}
              tone="success"
            />
            <StatTile
              label="Outstanding"
              value={formatCurrency(data.outstanding, currency)}
              hint={`Invoiced ${formatCurrency(data.invoiced, currency)}`}
              tone="warning"
            />
            <StatTile label="Collection rate" value={`${data.collectionRate}%`} hint="Collected ÷ invoiced this year" />
            <StatTile
              label="Overdue"
              value={formatCurrency(data.overdueAmount, currency)}
              hint={
                <button type="button" onClick={onShowDefaulters} className="cursor-pointer underline-offset-2 hover:underline">
                  {formatNumber(data.overdueCount)} overdue invoice{data.overdueCount === 1 ? "" : "s"} → defaulters
                </button>
              }
              tone={data.overdueAmount > 0 ? "danger" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900">Collections, last 6 months</h2>
                <span className="text-[11px] text-gray-500">Net of refunds</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid stroke="#eeeae2" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v: number) => compact(v, currency)}
                    />
                    <Tooltip cursor={{ fill: "rgba(28,38,58,0.05)" }} content={<TrendTooltip currency={currency} />} />
                    <Bar dataKey="collected" name="Collected" fill="#1C263A" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col p-4">
              <h2 className="mb-3 text-sm font-bold text-gray-900">By payment method</h2>
              {data.byMethod.length === 0 ? (
                <EmptyState title="No payments yet" description="Collected payments will be broken down by method here." />
              ) : (
                <ul className="space-y-3">
                  {data.byMethod.map((m) => {
                    const share = methodTotal > 0 ? Math.round((m.amount / methodTotal) * 100) : 0;
                    return (
                      <li key={m.method}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                          <span className="font-bold text-gray-800">{methodLabel(m.method)}</span>
                          <span className="text-gray-600">
                            {formatCurrency(m.amount, currency)} · {m.count} · {share}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-[#1C263A]" style={{ width: `${Math.max(share, 2)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {onCollect && (
                <div className="mt-auto pt-4">
                  <Button className="w-full" onClick={() => onCollect()}>
                    <Wallet className="h-4 w-4" /> Collect Payment
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </QueryState>
  );
};

export default OverviewTab;
