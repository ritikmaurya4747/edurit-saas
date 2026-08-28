import React from 'react';
import { Student, AttendanceStatus } from '../_data/attendanceData';

interface RowProps {
  student: Student;
  onStatusChange: (id: string, status: AttendanceStatus) => void;
}

const AttendanceRow = ({ student, onStatusChange }: RowProps) => {
  const getButtonStyles = (status: AttendanceStatus, targetStatus: AttendanceStatus) => {
    const baseStyle = "px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 border";
    
    if (status !== targetStatus) {
      return `${baseStyle} border-gray-200 text-gray-500 bg-white hover:bg-gray-50`;
    }

    switch (targetStatus) {
      case 'Present': return `${baseStyle} border-green-600 bg-green-600 text-white`;
      case 'Absent': return `${baseStyle} border-red-600 bg-red-600 text-white`;
      case 'Late': return `${baseStyle} border-yellow-500 bg-yellow-500 text-white`;
      case 'Half-day': return `${baseStyle} border-orange-500 bg-orange-500 text-white`;
      default: return baseStyle;
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="py-4 px-4 font-medium text-sm text-gray-600 w-24">
        {student.rollNo}
      </td>
      <td className="py-4 px-4 font-bold text-sm text-gray-900">
        {student.name}
      </td>
      <td className="py-4 px-4 min-w-[300px]">
        <div className="flex gap-2">
          <button 
            onClick={() => onStatusChange(student.id, 'Present')}
            className={getButtonStyles(student.status, 'Present')}
          >
            Present
          </button>
          <button 
            onClick={() => onStatusChange(student.id, 'Absent')}
            className={getButtonStyles(student.status, 'Absent')}
          >
            Absent
          </button>
          <button 
            onClick={() => onStatusChange(student.id, 'Late')}
            className={getButtonStyles(student.status, 'Late')}
          >
            Late
          </button>
          <button 
            onClick={() => onStatusChange(student.id, 'Half-day')}
            className={getButtonStyles(student.status, 'Half-day')}
          >
            Half-day
          </button>
        </div>
      </td>
      
      {/* New Emergency Call Column */}
      <td className="py-4 px-4 flex justify-center items-center h-full">
        <a 
          href={`tel:${student.parentContact}`}
          title={`Call ${student.name}'s parent`}
          className="flex items-center justify-center w-9 h-9 rounded-md border border-[#EBE3D8] hover:bg-[#FDFBF9] transition-colors"
        >
          {/* Ringing Phone SVG matching your image */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C96860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
            <path d="M14.05 6A5 5 0 0 1 18 10"></path>
          </svg>
        </a>
      </td>
    </tr>
  );
};

export default AttendanceRow;