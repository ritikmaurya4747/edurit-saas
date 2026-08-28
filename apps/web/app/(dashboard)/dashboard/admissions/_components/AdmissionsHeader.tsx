import React from 'react';

interface AdmissionsHeaderProps {
  totalCount?: number;
}

const AdmissionsHeader = ({ totalCount = 7 }: AdmissionsHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Admissions 2026-27</h1>
        <p className="text-sm text-gray-500">Manage new student applications, inquiries, and pipeline</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {/* Action Button */}
        <button className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer ml-auto md:ml-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Application
        </button>
      </div>
    </div>
  );
};

export default AdmissionsHeader;