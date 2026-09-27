"use client";
import React, { useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { EntranceTest, entranceTestsData } from '../data/admissionsData';

const EntranceTestsTable = () => {
  const columns = useMemo<ColumnDef<EntranceTest>[]>(() => [
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm font-medium">{row.original.className}</span> },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => <span className="text-sm">{row.original.date}</span> },
    { accessorKey: 'time', header: 'Time', cell: ({ row }) => <span className="text-sm">{row.original.time}</span> },
    { accessorKey: 'venue', header: 'Venue', cell: ({ row }) => <span className="text-sm">{row.original.venue}</span> },
    { accessorKey: 'registered', header: 'Registered', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.registered}</span> },
  ], []);

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Schedule test
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input type="text" placeholder="Search entrance tests..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-gray-200" />
        <span className="text-sm text-gray-500">{entranceTestsData.length} records</span>
      </div>
      <DataTable columns={columns} data={entranceTestsData} />
    </div>
  );
};

export default EntranceTestsTable;