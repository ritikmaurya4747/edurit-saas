import React from 'react';
import { pipelineData } from '../data/admissionsData';

const PipelineBoard = () => {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max mt-6">
        {pipelineData.map((stage) => (
          <div key={stage.title} className="w-full flex flex-col">
            {/* Stage Header */}
            <div className="flex justify-between items-center mb-2 px-1 text-sm font-bold text-[#6D839E]">
              <span>{stage.title}</span>
              <span>{stage.count}</span>
            </div>
            
            {/* Cards Column */}
            <div className="flex flex-col gap-3">
              {stage.cards.map(card => (
                <div key={card.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{card.name}</h4>
                  <p className="text-xs text-gray-500">{card.classApplied} · {card.source}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineBoard;