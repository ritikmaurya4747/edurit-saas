"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AttendanceTrendPoint } from "../data/dashboard.types";
import DashboardCard, { CardEmpty } from "./DashboardCard";

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | null }>;
  label?: string;
};

const AttendanceTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;

  return (
    <div className="rounded-md border border-[#dedede] bg-white px-2.5 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-[#737373]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#e49a14]">
        {value == null ? "No attendance recorded" : `Attendance: ${value}%`}
      </p>
    </div>
  );
};

// Y axis from the data: lowest value rounded down to 5 (with headroom), up to 100.
const computeDomain = (values: number[]): [number, number] => {
  if (!values.length) return [0, 100];
  const min = Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5);
  return [Math.min(min, 95), 100];
};

const computeTicks = ([min, max]: [number, number]) => {
  const span = max - min;
  const step = span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
};

const AttendanceTrend = ({ data }: { data: AttendanceTrendPoint[] }) => {
  const values = data.map((d) => d.percent).filter((v): v is number => v != null);
  const domain = computeDomain(values);

  return (
    <DashboardCard title="Attendance trend, last 6 months">
      {values.length === 0 ? (
        <CardEmpty>No daily attendance has been recorded in the last 6 months.</CardEmpty>
      ) : (
        <div className="mt-2 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 3, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#eeeae2" vertical={false} />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#718096", fontSize: 10 }}
                dy={5}
              />

              <YAxis
                domain={domain}
                ticks={computeTicks(domain)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#718096", fontSize: 9 }}
              />

              <Tooltip content={<AttendanceTooltip />} cursor={{ stroke: "#d7d7d7", strokeWidth: 1 }} />

              <Line
                type="monotone"
                dataKey="percent"
                stroke="#e69a12"
                strokeWidth={2}
                connectNulls
                dot={{ r: 2.5, fill: "#ffffff", stroke: "#e69a12", strokeWidth: 2 }}
                activeDot={{ r: 3.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
};

export default AttendanceTrend;
