import AttendanceOverview from "./components/AttendanceOverview";
import DashboardWelcome from "./components/DashboardWelcome";
import QuickActions from "./components/QuickActions";
import RecentActivities from "./components/RecentActivities";
import StatsCard from "./components/StatsCard";
import UpcomingEvents from "./components/UpcomingEvents";
import { BookOpen, TrendingUp, GraduationCap, Users } from "lucide-react";

const page = () => {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <DashboardWelcome />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="1,248"
            description="+12 this month"
            icon={Users}
            variant="green"
          />

          <StatsCard
            title="Total Teachers"
            value="86"
            description="+4 this month"
            icon={GraduationCap}
            variant="blue"
          />

          <StatsCard
            title="Total Classes"
            value="32"
            description="+2 this month"
            icon={BookOpen}
            variant="orange"
          />

          <StatsCard
            title="Attendance Rate"
            value="92.4%"
            description="+1.2% this week"
            icon={TrendingUp}
            variant="purple"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          <AttendanceOverview />
          <RecentActivities />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          <QuickActions />
          <UpcomingEvents />
        </section>
      </div>
    </main>
  );
};

export default page;
