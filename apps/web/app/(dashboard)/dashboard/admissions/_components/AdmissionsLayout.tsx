"use client";
import React, { useState } from 'react';
import PipelineBoard from './PipelineBoard';
import WaitlistTable from './WaitlistTable';
import EntranceTestsTable from './EntranceTestsTable';
import AdmissionsHeader from './AdmissionsHeader';

type TabType = 'pipeline' | 'waitlist' | 'entrance-tests';

const AdmissionsLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');

  const tabs = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'waitlist', label: 'Waitlist' },
    { id: 'entrance-tests', label: 'Entrance tests' },
  ];

  return (
    <div>
      <AdmissionsHeader/>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#1C263A] text-[#1C263A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      <div>
        {activeTab === 'pipeline' && <PipelineBoard />}
        {activeTab === 'waitlist' && <WaitlistTable />}
        {activeTab === 'entrance-tests' && <EntranceTestsTable />}
      </div>
    </div>
  );
};

export default AdmissionsLayout;