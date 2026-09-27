import React from 'react';
import StudentInfo from './StudentInfo';
import GradesTable from './GradesTable';
import ReportSummary from './ReportSummary';
import { reportData } from '../data/reportCardData';

const ReportCardLayout = () => {
  return (
    <div className="min-h-screen font-sans flex flex-col items-center">
      
      {/* Top Action Bar */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Result</h1>
        <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          Download PDF
        </button>
      </div>

      {/* Actual Report Card Paper */}
      <div className="w-full max-w-[900px] bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-12">
        {/* School Header Mock */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 tracking-tight">VIRTUAL ACADEMY</h1>
          <p className="text-gray-500 text-sm mt-1">Excellence in Education Since 1995</p>
        </div>

        <StudentInfo data={reportData} />
        <GradesTable subjects={reportData.subjects} />
        <ReportSummary subjects={reportData.subjects} />
      </div>

    </div>
  );
};

export default ReportCardLayout;