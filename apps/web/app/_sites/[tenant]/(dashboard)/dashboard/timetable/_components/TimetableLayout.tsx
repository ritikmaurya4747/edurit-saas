'use client'
import React, { useState } from 'react';
import Header from './Header';
import TimetableGrid from './TimetableGrid';
import ConflictWarning from './ConflictWarning';
import LessonPlanTracker from './LessonPlanTracker';

const TimetableLayout = () => {
    // State to manage the active tab
    const [activeTab, setActiveTab] = useState<'timetable' | 'lesson-plan'>('timetable');

    return (
        <div >

            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'timetable' ? (
                <>
                    <TimetableGrid />
                    <ConflictWarning />
                </>
            ) : (
                <LessonPlanTracker />
            )}

        </div>
    );
};

export default TimetableLayout;