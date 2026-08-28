import React from 'react';
import { SubjectGrade } from '../_data/reportCardData';

const ReportSummary = ({ subjects }: { subjects: SubjectGrade[] }) => {
  const totalMaxMarks = subjects.reduce((sum, sub) => sum + sub.totalMarks, 0);
  const totalObtained = subjects.reduce((sum, sub) => sum + sub.obtainedMarks, 0);
  const percentage = ((totalObtained / totalMaxMarks) * 100).toFixed(1);

  return (
    <div>
      <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
        <div className="text-center md:text-left">
          <span className="block text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Overall Performance</span>
          <span className="text-xl md:text-2xl font-bold text-gray-900">
            {totalObtained} <span className="text-gray-500 text-lg font-medium">/ {totalMaxMarks}</span>
          </span>
        </div>
        <div className="h-px md:h-12 w-full md:w-px bg-gray-300"></div>
        <div className="text-center">
          <span className="block text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Percentage</span>
          <span className="text-xl md:text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
        <div className="h-px md:h-12 w-full md:w-px bg-gray-300"></div>
        <div className="text-center md:text-right">
          <span className="block text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Result Status</span>
          <span className="text-xl md:text-2xl font-bold text-green-600">PASS</span>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-16 px-4 md:px-12">
        <div className="text-center">
          <div className="border-t border-gray-800 w-32 md:w-48 pt-2">
            <p className="text-sm font-bold text-gray-800">Class Teacher</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 w-32 md:w-48 pt-2">
            <p className="text-sm font-bold text-gray-800">Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummary;