import { BookOpen, FileText, GraduationCap, UserPlus } from "lucide-react";

const actions = [
  {
    id: 1,
    label: "Add Student",
    icon: UserPlus,
    className: "bg-emerald-50 text-emerald-600",
  },
  {
    id: 2,
    label: "Add Teacher",
    icon: GraduationCap,
    className: "bg-blue-50 text-blue-600",
  },
  {
    id: 3,
    label: "Create Class",
    icon: BookOpen,
    className: "bg-orange-50 text-orange-600",
  },
  {
    id: 4,
    label: "Generate Report",
    icon: FileText,
    className: "bg-purple-50 text-purple-600",
  },
];

const QuickActions = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-slate-900">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              className={`
                flex min-h-27.5 flex-col items-center
                justify-center gap-3 rounded-xl
                transition hover:-translate-y-0.5 hover:shadow-sm
                ${action.className}
              `}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
                <Icon size={20} />
              </div>

              <span className="text-sm font-medium text-slate-800">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
