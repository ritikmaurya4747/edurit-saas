import React from 'react';
import { Student } from './attendanceData';

interface HeaderProps {
  students: Student[];
  onMarkAll: (status: 'Present' | 'Absent') => void;
}

const AttendanceHeader = ({ students, onMarkAll }: HeaderProps) => {
  const total = students.length;
  const present = students.filter(s => s.status === 'Present').length;
  const absent = students.filter(s => s.status === 'Absent').length;

  // Format today's date
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="mb-6 bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Daily Attendance</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <span className="bg-gray-100 px-2 py-1 rounded">Class 8 - B</span>
          <span>•</span>
          <span>{today}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        {/* Real-time Summary */}
        <div className="flex gap-3 text-sm">
          <div className="flex flex-col items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
            <span className="font-bold text-lg">{total}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
          </div>
          <div className="flex flex-col items-center px-3 py-1 bg-green-50 text-green-700 rounded-lg">
            <span className="font-bold text-lg">{present}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Present</span>
          </div>
          <div className="flex flex-col items-center px-3 py-1 bg-red-50 text-red-700 rounded-lg">
            <span className="font-bold text-lg">{absent}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Absent</span>
          </div>
        </div>

        <div className="h-px sm:h-10 w-full sm:w-px bg-gray-200 hidden sm:block"></div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => onMarkAll('Present')}
            className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-md transition-colors border border-green-200"
          >
            Mark All Present
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;