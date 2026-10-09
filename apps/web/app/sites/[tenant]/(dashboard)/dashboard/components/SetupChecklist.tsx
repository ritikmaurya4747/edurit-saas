import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import type { DashboardOverview } from "../data/dashboard.types";

type Step = { label: string; hint: string; done: boolean; href: string };

export const buildSetupSteps = (setup: DashboardOverview["setup"]): Step[] => [
  {
    label: "Create the academic year",
    hint: "Set the current session (e.g. 2026-27)",
    done: setup.hasAcademicYear,
    href: "/dashboard/academics",
  },
  {
    label: "Add classes & sections",
    hint: `${setup.classes} classes, ${setup.sections} sections`,
    done: setup.classes > 0 && setup.sections > 0,
    href: "/dashboard/academics",
  },
  {
    label: "Add subjects",
    hint: `${setup.subjects} subjects`,
    done: setup.subjects > 0,
    href: "/dashboard/academics",
  },
  {
    label: "Add staff & teachers",
    hint: `${setup.staff} active staff`,
    done: setup.staff > 0,
    href: "/dashboard/staff-hr",
  },
  {
    label: "Admit students",
    hint: `${setup.students} active students`,
    done: setup.students > 0,
    href: "/dashboard/students",
  },
];

const SetupChecklist = ({ steps }: { steps: Step[] }) => {
  const done = steps.filter((s) => s.done).length;

  return (
    <section className="mb-5 rounded-xl border border-amber-300 bg-amber-50/40 px-4 pb-4 pt-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[12px] font-semibold text-[#162033]">Finish setting up your school</h2>
          <p className="mt-0.5 text-[10.5px] text-[#65758b]">
            {done} of {steps.length} steps complete. Complete these to unlock attendance, fees and exams.
          </p>
        </div>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-amber-100">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>

      <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={`flex h-full items-start gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors hover:border-[#1C263A]/40 ${
                step.done ? "border-emerald-200" : "border-[#e5e1d8]"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-[#b6bfcb]" />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[10.5px] font-semibold ${step.done ? "text-[#65758b] line-through" : "text-[#111827]"}`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 block text-[10px] text-[#8b96a5]">{step.hint}</span>
              </span>
              {!step.done && <ChevronRight className="mt-px h-3 w-3 shrink-0 text-[#8b96a5]" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default SetupChecklist;
