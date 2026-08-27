import React from 'react';

// Define props interface
interface HeaderProps {
  activeTab: 'timetable' | 'lesson-plan';
  setActiveTab: (tab: 'timetable' | 'lesson-plan') => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Timetable</h1>
      <p className="text-gray-500 text-sm mb-4">Class 8 - B · Weekly schedule & lesson plan tracking</p>
      
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('timetable')}
          className={`px-1 py-2 mr-6 text-sm transition-colors duration-200 ${
            activeTab === 'timetable' 
              ? 'font-semibold text-gray-900 border-b-2 border-gray-900' 
              : 'font-medium text-gray-500 hover:text-gray-700'
          }`}
        >
          Weekly timetable
        </button>
        <button 
          onClick={() => setActiveTab('lesson-plan')}
          className={`px-1 py-2 text-sm transition-colors duration-200 ${
            activeTab === 'lesson-plan' 
              ? 'font-semibold text-gray-900 border-b-2 border-gray-900' 
              : 'font-medium text-gray-500 hover:text-gray-700'
          }`}
        >
          Lesson plan tracker
        </button>
      </div>
    </div>
  );
};

export default Header;