import type { ReactNode } from "react";
import { fmtMarks, type ReportCardDetail } from "../../exams/api";

const Divider = () => <div className="h-px w-full bg-gray-300 md:h-12 md:w-px print:h-12 print:w-px" />;

const Stat = ({ label, children, align = "center" }: { label: string; children: ReactNode; align?: "left" | "center" | "right" }) => (
  <div className={align === "left" ? "text-center md:text-left" : align === "right" ? "text-center md:text-right" : "text-center"}>
    <span className="mb-1 block text-sm font-bold uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </div>
);

const ReportSummary = ({ data, remarks }: { data: ReportCardDetail; remarks?: ReactNode }) => {
  const { totals } = data;
  return (
    <div>
      <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:flex-row md:p-6 print:flex-row print-avoid-break">
        <Stat label="Overall" align="left">
          <span className="text-xl font-bold text-gray-900 md:text-2xl">
            {fmtMarks(totals.obtained)} <span className="text-lg font-medium text-gray-500">/ {fmtMarks(totals.max)}</span>
          </span>
        </Stat>
        <Divider />
        <Stat label="Percentage">
          <span className="text-xl font-bold text-gray-900 md:text-2xl">
            {totals.percent === null ? "—" : `${totals.percent.toFixed(1)}%`}
          </span>
        </Stat>
        <Divider />
        <Stat label="Grade">
          <span className="text-xl font-bold text-indigo-700 md:text-2xl">{totals.grade ?? "—"}</span>
        </Stat>
        <Divider />
        <Stat label="Rank">
          <span className="text-xl font-bold text-gray-900 md:text-2xl">
            {totals.rank ?? "—"}
            {totals.rank !== null && <span className="text-lg font-medium text-gray-500"> / {totals.classSize}</span>}
          </span>
        </Stat>
        <Divider />
        <Stat label="Result" align="right">
          <span
            className={`text-xl font-bold md:text-2xl ${
              totals.result === "PASS" ? "text-green-600" : totals.result === "FAIL" ? "text-red-600" : "text-gray-400"
            }`}
          >
            {totals.result ?? "—"}
          </span>
        </Stat>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 p-4 print-avoid-break">
        <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-500">Class Teacher&apos;s Remarks</span>
        {remarks ?? <p className="min-h-12 text-sm text-gray-800">{data.remarks || "—"}</p>}
      </div>

      {/* Signature Section */}
      <div className="mt-16 flex items-end justify-between px-4 md:px-12 print-avoid-break">
        {["Class Teacher", "Parent / Guardian", "Principal"].map((label) => (
          <div key={label} className="text-center">
            <div className="w-24 border-t border-gray-800 pt-2 sm:w-36 md:w-44">
              <p className="text-sm font-bold text-gray-800">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportSummary;
