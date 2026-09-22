import React from 'react';
import LessonPlanCard from './LessonPlanCard';
import { lessonPlans } from '../_data/timetable-data';

const LessonPlanTracker = () => {
  return (
    <div className="mt-6">
      {lessonPlans.map((plan) => (
        <LessonPlanCard key={plan.id} {...plan} />
      ))}
    </div>
  );
};

export default LessonPlanTracker;