import DashboardHeader from "./_components/DashboardHeader";
import DashboardStats from "./_components/DashboardStats";
import AttendanceTrend from "./_components/AttendanceTrend";
import NoticesAttention from "./_components/NoticesAttention";

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