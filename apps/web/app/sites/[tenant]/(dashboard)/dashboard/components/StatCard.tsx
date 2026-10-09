import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  trend?: string;
  trendType?: "up" | "down";
  danger?: boolean;
  warning?: boolean;
};

const StatCard = ({ title, value, description, trend, trendType, danger, warning }: StatCardProps) => {
  const borderClass = danger ? "border-red-500" : warning ? "border-amber-500" : "border-[#dedbd3]";

  const valueClass = danger ? "text-red-600" : "text-[#0d1626]";

  return (
    <article
      className={`relative rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#52637a]">{title}</p>

          <p className={`mt-1 font-serif text-[25px] leading-none ${valueClass}`}>{value}</p>

          <p className="mt-1.5 text-[10px] text-[#718096]">{description}</p>
        </div>

        {trend && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
              trendType === "down" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {trendType === "down" ? (
              <ArrowDownRight className="mr-0.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" />
            )}

            {trend}
          </span>
        )}
      </div>
    </article>
  );
};

export default StatCard;
