"use client"
import React, { useState } from 'react';
import HomeworkHeader from './HomeworkHeader';
import HomeworkList from './HomeworkList';
import { homeworkList, HomeworkStatus } from '../data/homeworkData';

const HomeworkLayout = () => {
  const [activeFilter, setActiveFilter] = useState<HomeworkStatus | 'All'>('All');

  // Filter logic
  const filteredHomework = homeworkList.filter((hw) => 
    activeFilter === 'All' ? true : hw.status === activeFilter
  );

  return (
    // Responsive padding added here
      <div >
        <HomeworkHeader activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        <HomeworkList homeworks={filteredHomework} />
      </div>
  );
};

export default HomeworkLayout;