import React from 'react';
import { StudentReport } from '../_data/reportCardData';

const StudentInfo = ({ data }: { data: StudentReport }) => {
  return (
    <div className="border-b-2 border-gray-800 pb-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 uppercase tracking-wide">
          {data.term} Report
        </h2>
        <p className="text-sm text-gray-600 font-medium mt-1">Academic Year {data.academicYear}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm md:text-base">
        <div className="space-y-2">
          <div className="flex"><span className="font-bold w-32 text-gray-700">Student Name:</span> <span className="font-semibold text-gray-900">{data.studentName}</span></div>
          <div className="flex"><span className="font-bold w-32 text-gray-700">Class & Sec:</span> <span className="text-gray-900">{data.className} - {data.section}</span></div>
        </div>
        <div className="space-y-2 sm:text-right">
          <div className="flex sm:justify-end"><span className="font-bold w-32 sm:w-auto sm:mr-2 text-gray-700">Roll Number:</span> <span className="text-gray-900">{data.rollNumber}</span></div>
          <div className="flex sm:justify-end"><span className="font-bold w-32 sm:w-auto sm:mr-2 text-gray-700">Attendance:</span> <span className="text-gray-900">{data.attendance}/{data.totalWorkingDays} days</span></div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfo;