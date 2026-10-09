"use client";

import { Plus } from "lucide-react";

interface FeeHeaderProps {
  onCollectClick?: () => void;
}

const FeeHeader = ({ onCollectClick }: FeeHeaderProps) => (
  <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold text-gray-900 md:text-3xl">Fee Management</h1>
      <p className="text-sm text-gray-500">Fee structures, student invoices, collections, receipts and refunds</p>
    </div>

    {onCollectClick && (
      <div className="flex w-full items-center gap-3 md:w-auto">
        <button
          type="button"
          onClick={onCollectClick}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-[#1C263A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#111827] md:ml-0"
        >
          <Plus className="h-4 w-4" />
          Collect Payment
        </button>
      </div>
    )}
  </div>
);

export default FeeHeader;
