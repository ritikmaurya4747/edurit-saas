import type { ReactNode } from "react";
import { formatDate, humanize } from "@/lib/utils/format";
import type { ReportCardDetail } from "../../exams/api";

const Row = ({ label, children, right }: { label: string; children: ReactNode; right?: boolean }) => (
  <div className={right ? "flex sm:justify-end print:justify-end" : "flex"}>
    <span className={right ? "w-36 font-bold text-gray-700 sm:mr-2 sm:w-auto print:mr-2 print:w-auto" : "w-36 shrink-0 font-bold text-gray-700"}>
      {label}:
    </span>
    <span className="font-semibold text-gray-900">{children}</span>
  </div>
);

const StudentInfo = ({ data }: { data: ReportCardDetail }) => {
  const { student, exam, attendance } = data;
  return (
    <div className="mb-6 border-b-2 border-gray-800 pb-6">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold uppercase tracking-wide text-gray-900 md:text-3xl">{exam.name} Report</h2>
        {exam.academicYear && <p className="mt-1 text-sm font-medium text-gray-600">Academic Year {exam.academicYear}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 print:grid-cols-2 md:text-base">
        <div className="space-y-2">
          <Row label="Student Name">{student.name}</Row>
          <Row label="Class & Sec">
            {student.className} - {student.sectionName}
          </Row>
          <Row label="Admission No">{student.admissionNumber}</Row>
          {student.guardianName && (
            <Row label={student.guardianRelationship ? `${humanize(student.guardianRelationship)}'s Name` : "Guardian"}>
              {student.guardianName}
            </Row>
          )}
        </div>
        <div className="space-y-2 sm:text-right">
          <Row label="Roll Number" right>
            {student.rollNumber ?? "—"}
          </Row>
          <Row label="Date of Birth" right>
            {formatDate(student.dob)}
          </Row>
          <Row label="Attendance" right>
            {attendance.total
              ? `${attendance.present}/${attendance.total} days (${attendance.percent?.toFixed(1)}%)`
              : "Not recorded"}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default StudentInfo;
