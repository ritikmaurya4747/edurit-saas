import React from 'react';
import TimetableCell from './TimetableCell';
import { days, scheduleData } from '../_data/timetable-data';

const TimetableGrid = () => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-5 w-full">
      
      {/* Scrollable Wrapper */}
      <div className="overflow-x-auto w-full">
        
        {/* Container for the Grid - ensures it takes full width of the scroll area */}
        <div className="w-full">
          
          {/* Table Header - Added minmax(140px, 1fr) to force minimum column width */}
          <div className="grid grid-cols-[80px_repeat(6,minmax(140px,1fr))] bg-[#FCFBF8] border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider py-4">
            <div className="px-6 flex items-center">Period</div>
            {days.map((day) => (
              <div key={day} className="px-4 flex items-center">{day}</div>
            ))}
          </div>
          
          {/* Table Body - Same grid-cols applied here */}
          {scheduleData.map((row, index) => (
            <div key={`period-${index}`} className="grid grid-cols-[80px_repeat(6,minmax(140px,1fr))] border-b last:border-b-0 border-gray-100 min-w-max md:min-w-0">
              <div className="px-6 flex items-center text-sm font-bold text-gray-600 bg-white">
                P{index + 1}
              </div>
              {row.map((cell, cellIndex) => (
                <TimetableCell key={`cell-${index}-${cellIndex}`} {...cell} />
              ))}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;