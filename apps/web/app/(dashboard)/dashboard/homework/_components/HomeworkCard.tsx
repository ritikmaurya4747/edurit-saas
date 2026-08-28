import React from 'react';
import { Homework } from '../_data/homeworkData';

const HomeworkCard = ({ subject, title, teacher, dueDate, status, description }: Homework) => {
  // Dynamic styles based on status
  const statusStyles = {
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          {subject}
        </span>
        <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-3">{description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">ASSIGNED BY</span>
          <span className="text-xs sm:text-sm font-semibold text-gray-700">{teacher}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">DUE DATE</span>
          <span className={`text-xs sm:text-sm font-semibold ${status === 'Overdue' ? 'text-red-600' : 'text-gray-700'}`}>
            {new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomeworkCard;