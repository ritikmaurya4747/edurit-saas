"use client"
import React, { useState } from 'react';
import AttendanceHeader from './AttendanceHeader';
import AttendanceList from './AttendanceList';
import { AttendanceStatus, initialStudents } from '../_data/attendanceData';

const AttendanceLayout = () => {
    // State to hold all students' attendance data
    const [students, setStudents] = useState(initialStudents);

    // Handler for individual student status change
    const handleStatusChange = (id: string, status: AttendanceStatus) => {
        setStudents(prev =>
            prev.map(student =>
                student.id === id ? { ...student, status } : student
            )
        );
    };

    // Handler for "Mark All Present" button
    const handleMarkAll = (status: 'Present' | 'Absent') => {
        setStudents(prev =>
            prev.map(student => ({ ...student, status }))
        );
    };

    // Check if all students are marked (no 'Unmarked' left)
    const isComplete = students.every(s => s.status !== 'Unmarked');

    return (
        <div>
            <AttendanceHeader
                students={students}
                onMarkAll={handleMarkAll}
            />

            <AttendanceList
                students={students}
                onStatusChange={handleStatusChange}
            />

            {/* Submit Action at the bottom */}
            <div className="mt-6 flex justify-end">
                <button
                    disabled={!isComplete}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${isComplete
                        ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isComplete ? 'Submit Attendance' : 'Mark all students to submit'}
                </button>
            </div>

        </div>
    );
};

export default AttendanceLayout;