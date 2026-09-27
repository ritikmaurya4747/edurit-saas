import React from 'react';
import { LessonPlan } from '../data/timetable-data';

const LessonPlanCard = ({ subject, teacher, className, completedTopics, totalTopics, colorClass }: LessonPlan) => {
  const percentage = Math.round((completedTopics / totalTopics) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
            <span className="font-bold text-sm text-gray-800">{subject}</span>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            {teacher} · {className}
          </div>
        </div>
        <div className="text-sm">
          <span className="font-bold text-gray-800">{completedTopics}/{totalTopics}</span>
          <span className="text-gray-500 ml-1">topics ({percentage}%)</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-[#F4F1ED] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#276B4B] rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LessonPlanCard;