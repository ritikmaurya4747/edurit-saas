"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { attendanceData } from "../data/dashboard.data";

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
};

const AttendanceTooltip = ({
  active,
  payload,
  label,
}: TooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-[#dedede] bg-white px-2.5 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-[#737373]">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-[#e49a14]">
        value : {payload[0]?.value}
      </p>
    </div>
  );
};

const AttendanceTrend = () => {
  return (
    <article className="rounded-xl border border-[#dedbd3] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="mb-2 text-[12px] font-semibold text-[#162033]">
        Attendance trend, last 6 months
      </h2>

      <div className="h-35 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={attendanceData}
            margin={{
              top: 3,
              right: 0,
              left: -22,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#eeeae2"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#718096",
                fontSize: 10,
              }}
              dy={5}
            />

            <YAxis
              domain={[80, 100]}
              ticks={[80, 85, 90, 95, 100]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#718096",
                fontSize: 9,
              }}
            />

            <Tooltip
              content={<AttendanceTooltip />}
              cursor={{
                stroke: "#d7d7d7",
                strokeWidth: 1,
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#e69a12"
              strokeWidth={2}
              dot={{
                r: 2.5,
                fill: "#ffffff",
                stroke: "#e69a12",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 3.5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};

export default AttendanceTrend;