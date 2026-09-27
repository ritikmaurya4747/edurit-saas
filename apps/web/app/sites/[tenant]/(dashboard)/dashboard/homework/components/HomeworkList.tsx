import React from 'react';
import HomeworkCard from './HomeworkCard';
import { Homework } from '../data/homeworkData';

interface ListProps {
  homeworks: Homework[];
}

const HomeworkList = ({ homeworks }: ListProps) => {
  if (homeworks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">No homework found for this filter.</p>
      </div>
    );
  }

  return (
    // Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {homeworks.map((hw) => (
        <HomeworkCard key={hw.id} {...hw} />
      ))}
    </div>
  );
};

export default HomeworkList;