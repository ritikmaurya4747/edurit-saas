import DashboardHeader from "./components/DashboardHeader";
import DashboardStats from "./components/DashboardStats";
import AttendanceTrend from "./components/AttendanceTrend";
import NoticesAttention from "./components/NoticesAttention";

const page = () => {
  return (
      <div >
        <DashboardHeader />

        <DashboardStats />

        <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.65fr_0.95fr]">
          <AttendanceTrend />
          <NoticesAttention />
        </section>
     </div>
  );
};

export default page;