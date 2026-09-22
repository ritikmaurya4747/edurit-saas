"use client";

import { Student, AttendanceStatus } from '../_data/attendanceData';

interface AttendanceListProps {
  students: Student[];
  onStatusChange: (id: string, status: AttendanceStatus) => void;
}

const AttendanceList = ({ students, onStatusChange }: AttendanceListProps) => {
  const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half-day'];

  const getStatusStyle = (isActive: boolean, status: AttendanceStatus) => {
    if (!isActive) {
      return 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50';
    }
    if (status === 'Present') return 'border-green-600 bg-green-600 text-white';
    if (status === 'Absent') return 'border-red-600 bg-red-600 text-white';
    if (status === 'Late') return 'border-yellow-500 bg-yellow-500 text-white';
    return 'border-orange-500 bg-orange-500 text-white';
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-bold text-gray-700">Roll No</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700">Student Name</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700">Attendance Status</th>
            <th className="text-left px-4 py-3 font-bold text-gray-700">Emergency</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{student.rollNo}</td>
              <td className="px-4 py-3 font-bold text-gray-900">{student.name}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2 flex-wrap">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => onStatusChange(student.id, status)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 border cursor-pointer ${getStatusStyle(
                        student.status === status,
                        status
                      )}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <a
                  href={`tel:${student.parentContact}`}
                  className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C96860"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    <path d="M14.05 2a9 9 0 0 1 8 7.94" />
                    <path d="M14.05 6A5 5 0 0 1 18 10" />
                  </svg>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;