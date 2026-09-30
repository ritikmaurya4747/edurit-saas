import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  variant: "green" | "blue" | "orange" | "purple";
}

const variants = {
  green: {
    card: "bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-600",
  },
  blue: {
    card: "bg-blue-50/70",
    icon: "bg-blue-100 text-blue-600",
  },
  orange: {
    card: "bg-orange-50/70",
    icon: "bg-orange-100 text-orange-600",
  },
  purple: {
    card: "bg-purple-50/70",
    icon: "bg-purple-100 text-purple-600",
  },
};

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  variant,
}: StatsCardProps) => {
  const styles = variants[variant];

  return (
    <div
      className={`
        rounded-2xl border border-slate-200
        p-5 shadow-sm transition
        hover:-translate-y-0.5 hover:shadow-md
        ${styles.card}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            flex h-11 w-11 items-center justify-center
            rounded-full
            ${styles.icon}
          `}
        >
          <Icon size={21} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>

          <p className="mt-1 text-xs font-medium text-emerald-600">
            ↗ {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
