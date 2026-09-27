import StatCard from "./StatCard";
import { dashboardStats } from "../data/dashboard.data";

const DashboardStats = () => {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {dashboardStats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          trend={stat.trend}
          trendType={stat.trendType}
          danger={stat.danger}
          warning={stat.warning}
        />
      ))}
    </section>
  );
};

export default DashboardStats;