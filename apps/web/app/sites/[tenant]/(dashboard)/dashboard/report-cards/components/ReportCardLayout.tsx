import type { ReactNode } from "react";
import { formatDate } from "@/lib/utils/format";
import type { ReportCardDetail } from "../../exams/api";
import GradesTable from "./GradesTable";
import ReportSummary from "./ReportSummary";
import StudentInfo from "./StudentInfo";

// The printable report card "paper". `remarks` replaces the read-only remarks
// block (used for the inline editor on screen).
const ReportCardLayout = ({ data, remarks, className }: { data: ReportCardDetail; remarks?: ReactNode; className?: string }) => (
  <div
    className={`w-full max-w-225 rounded-xl border border-gray-200 bg-white p-6 shadow-lg md:p-12 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none ${className ?? ""}`}
  >
    <div className="mb-8 text-center">
      {data.school.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.school.logoUrl} alt="" className="mx-auto mb-3 h-16 w-16 object-contain" />
      )}
      <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">{data.school.name}</h1>
      <p className="mt-1 text-sm text-gray-500">Progress Report</p>
    </div>

    <StudentInfo data={data} />
    {data.subjects.length ? (
      <GradesTable subjects={data.subjects} />
    ) : (
      <p className="mb-8 text-center text-sm text-gray-500">No subjects are scheduled for this exam.</p>
    )}
    <ReportSummary data={data} remarks={remarks} />

    <p className="mt-8 text-center text-[11px] text-gray-400">
      {data.generatedAt ? `Generated on ${formatDate(data.generatedAt)}` : "Provisional — computed from current marks"} · Grades: A1 ≥ 91, A2 ≥
      81, B1 ≥ 71, B2 ≥ 61, C1 ≥ 51, C2 ≥ 41, D ≥ 33, E &lt; 33
    </p>
  </div>
);

export default ReportCardLayout;
