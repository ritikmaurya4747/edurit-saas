import React from 'react';
interface TimetableCellProps {
    subject: string;
    teacher: string;
    color: string;
    isConflict?: boolean; // Optional boolean
}
const TimetableCell = ({ subject, teacher, color, isConflict }: TimetableCellProps) => {
    return (
        <div className={`p-4 flex flex-col justify-center ${isConflict ? 'bg-red-50' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${color}`}></span>
                <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    {subject}
                    {isConflict && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                        </svg>
                    )}
                </span>
            </div>
            <span className="text-[11px] font-medium text-gray-400 ml-4 uppercase tracking-wide">{teacher}</span>
        </div>
    );
};

export default TimetableCell;