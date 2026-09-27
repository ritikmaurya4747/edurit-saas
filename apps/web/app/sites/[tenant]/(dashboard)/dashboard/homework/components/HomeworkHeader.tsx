import React from 'react';
import { HomeworkStatus } from '../data/homeworkData';

interface HeaderProps {
  activeFilter: HomeworkStatus | 'All';
  setActiveFilter: (filter: HomeworkStatus | 'All') => void;
}

const HomeworkHeader = ({ activeFilter, setActiveFilter }: HeaderProps) => {
  const filters: (HomeworkStatus | 'All')[] = ['All', 'Pending', 'Completed', 'Overdue'];

  return (
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1 md:mb-2">Homework</h1>
        <p className="text-gray-500 text-sm">Track and manage your daily assignments</p>
      </div>
      
      {/* Scrollable filters for mobile */}
      <div className="flex overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm min-w-max">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-gray-900 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeworkHeader;