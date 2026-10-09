"use client";

import { Phone } from "lucide-react";
import { Badge } from "@/components/ui";
import { humanize } from "@/lib/utils/format";
import { STATUSES, type AttendanceStatus, type RosterStudent } from "../types";

export interface RowMark {
  status: AttendanceStatus | null;
  remarks: string;
}

interface AttendanceListProps {
  students: RosterStudent[];
  marks: Record<string, RowMark>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
  disabled?: boolean;
}

const activeStyle: Record<AttendanceStatus, string> = {
  PRESENT: "border-green-600 bg-green-600 text-white",
  ABSENT: "border-red-600 bg-red-600 text-white",
  LATE: "border-yellow-500 bg-yellow-500 text-white",
  EXCUSED: "border-purple-600 bg-purple-600 text-white",
};

const AttendanceList = ({ students, marks, onStatusChange, onRemarksChange, disabled }: AttendanceListProps) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
    <table className="w-full min-w-180 text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-[#FCFBF8]">
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Roll</th>
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Student</th>
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Remarks</th>
          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400">Guardian</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => {
          const mark = marks[student.studentId] ?? { status: null, remarks: "" };
          return (
            <tr key={student.studentId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
              <td className="w-16 px-4 py-3 font-medium text-gray-600">{student.rollNumber ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="font-bold text-gray-900">{student.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {student.admissionNumber}
                  {student.onLeave && (
                    <Badge tone="purple" className="px-1.5 py-0.5 text-[10px]">
                      On approved leave
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={disabled}
                      onClick={() => onStatusChange(student.studentId, status)}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed ${
                        mark.status === status ? activeStyle[status] : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {humanize(status)}
                    </button>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <input
                  value={mark.remarks}
                  disabled={disabled}
                  onChange={(e) => onRemarksChange(student.studentId, e.target.value)}
                  placeholder="Optional"
                  maxLength={500}
                  className="w-full min-w-35 rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#1C263A] disabled:bg-gray-50"
                />
              </td>
              <td className="px-4 py-3 text-center">
                {student.guardianPhone ? (
                  <a
                    href={`tel:${student.guardianPhone}`}
                    title={`Call ${student.name}'s guardian (${student.guardianPhone})`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#EBE3D8] transition-colors hover:bg-[#FDFBF9]"
                  >
                    <Phone className="h-4 w-4 text-[#C96860]" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default AttendanceList;
