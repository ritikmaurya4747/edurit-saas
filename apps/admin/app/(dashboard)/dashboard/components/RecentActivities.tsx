import {
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  UserRound,
} from "lucide-react";

const activities = [
  {
    id: 1,
    title: "New student registered",
    description: "Rahul Sharma · Class 6-A",
    time: "10 min ago",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Fee payment received",
    description: "₹25,000 · Class 8-B",
    time: "35 min ago",
    icon: CreditCard,
  },
  {
    id: 3,
    title: "Teacher added",
    description: "Amit Kumar · Mathematics",
    time: "1 hour ago",
    icon: GraduationCap,
  },
  {
    id: 4,
    title: "New class created",
    description: "Class 8-A · Academic Year 2026-27",
    time: "2 hours ago",
    icon: BookOpen,
  },
  {
    id: 5,
    title: "Exam schedule updated",
    description: "Half Yearly Exams · Class 9-12",
    time: "3 hours ago",
    icon: FileText,
  },
];

const RecentActivities = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Recent Activities
        </h2>

        <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
          View All →
        </button>
      </div>

      <div className="space-y-5">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Icon size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {activity.title}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {activity.description}
                </p>
              </div>

              <span className="whitespace-nowrap text-[11px] text-slate-400">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivities;
