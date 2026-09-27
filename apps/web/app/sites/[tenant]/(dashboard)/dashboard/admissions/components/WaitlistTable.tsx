"use client";
import React, { useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { WaitlistEntry, waitlistData } from '../data/admissionsData';

const WaitlistTable = () => {
  const columns = useMemo<ColumnDef<WaitlistEntry>[]>(() => [
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm font-medium">{row.original.className}</span> },
    { accessorKey: 'position', header: 'Position', cell: ({ row }) => <span className="text-sm">{row.original.position}</span> },
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="text-sm text-gray-900">{row.original.name}</span> },
    { accessorKey: 'waitingSince', header: 'Waiting Since', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.waitingSince}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const isPending = row.original.status === 'Pending';
        return (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPending ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
            {row.original.status}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.status === 'Approved') return <span className="text-sm text-gray-400">Notified</span>;
        return (
          <button className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            Notify — seat open
          </button>
        );
      }
    }
  ], []);

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <input type="text" placeholder="Search waitlist..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-gray-200" />
        <span className="text-sm text-gray-500">{waitlistData.length} records</span>
      </div>
      <DataTable columns={columns} data={waitlistData} />
    </div>
  );
};

export default WaitlistTable;