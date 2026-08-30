"use client";
import React, { useState, useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { DeskSlip, initialDeskSlips, SlipStatus } from './_data/deskSlipsData';

const DeskSlipsPage = () => {
  const [slips, setSlips] = useState<DeskSlip[]>(initialDeskSlips);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  console.log(setSlips, isGenerateModalOpen);
  // States for View & Print Modal Preview
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeSlip, setActiveSlip] = useState<DeskSlip | null>(null);

  // Direct Print Handler
  const handlePrintSlip = (slip: DeskSlip) => {
    setActiveSlip(slip);
    setIsViewModalOpen(true);
    // Timeout diya hai taaki modal open hote hi print dialog trigger ho jaye
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const columns = useMemo<ColumnDef<DeskSlip>[]>(() => [
    { accessorKey: 'rollNo', header: 'Roll No', cell: ({ row }) => <span className="font-bold text-xs text-gray-500 uppercase">{row.original.rollNo}</span> },
    { accessorKey: 'studentName', header: 'Student Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.studentName}</span> },
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.className}</span> },
    { accessorKey: 'examName', header: 'Examination', cell: ({ row }) => <span className="text-sm text-gray-700 font-medium">{row.original.examName}</span> },
    { accessorKey: 'roomNo', header: 'Room / Hall', cell: ({ row }) => <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">{row.original.roomNo}</span> },
    { accessorKey: 'seatNo', header: 'Seat No', cell: ({ row }) => <span className="text-sm font-bold text-gray-900">{row.original.seatNo}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const status: SlipStatus = row.original.status;
        let badge = 'bg-gray-50 text-gray-700 border-gray-200';
        if (status === 'Printed') badge = 'bg-green-50 text-green-700 border-green-200';
        if (status === 'Generated') badge = 'bg-blue-50 text-blue-700 border-blue-200';
        if (status === 'Assigned') badge = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge}`}>{status}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* View Button */}
          <button 
            onClick={() => { setActiveSlip(row.original); setIsViewModalOpen(true); }}
            className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors cursor-pointer border border-gray-200"
            title="View Desk Slip"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>

          {/* Direct Print Button */}
          <button 
            onClick={() => handlePrintSlip(row.original)}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>
      ),
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Desk Slips & Seat Allocation</h1>
          <p className="text-sm text-gray-500">Manage examination hall seating arrangements and preview student desk slips</p>
        </div>
        <button 
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer ml-auto md:ml-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Generate Slips
        </button>
      </div>

      {/* Main Table - Hidden when printing */}
      <div className="print:hidden">
        <DataTable columns={columns} data={slips} />
      </div>

      {/* View & Print Preview Modal (Optimized for window.print) */}
      {isViewModalOpen && activeSlip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-6 border border-gray-100 print:shadow-none print:border-none print:max-w-none">
            
            {/* Modal Header - Hide close button on print */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Examination Desk Slip</span>
                <h3 className="text-lg font-bold text-gray-900">{activeSlip.examName}</h3>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-lg hover:bg-gray-100 print:hidden"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 print:bg-white p-4 rounded-xl border border-gray-200 text-sm">
              <div>
                <span className="block text-xs font-medium text-gray-500">Student Name</span>
                <span className="font-bold text-gray-900">{activeSlip.studentName}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">Roll Number</span>
                <span className="font-bold text-gray-900">{activeSlip.rollNo}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">Class & Section</span>
                <span className="font-semibold text-gray-800">{activeSlip.className}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">Current Status</span>
                <span className="font-semibold text-green-700">{activeSlip.status}</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-indigo-50/60 print:bg-gray-100 p-4 rounded-xl border border-indigo-100">
              <div>
                <span className="block text-xs font-medium text-indigo-600">Allocated Venue</span>
                <span className="text-base font-bold text-indigo-900">{activeSlip.roomNo}</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-medium text-indigo-600">Seat Key</span>
                <span className="text-base font-bold text-indigo-900">{activeSlip.seatNo}</span>
              </div>
            </div>

            {/* Modal Actions - Hidden when printing */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()} 
                className="px-5 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800 shadow-sm"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Slips Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Generate Exam Desk Slips</h3>
            <p className="text-xs text-gray-500">Select class and examination to auto-assign room numbers and seat keys.</p>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white cursor-pointer">
                <option>Mid-Term Exam 2026</option>
                <option>Final Term Exam 2026</option>
              </select>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white cursor-pointer">
                <option>All Classes</option>
                <option>Class 10-A & 10-B</option>
                <option>Class 12-Science</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert("Desk slips generated and assigned successfully!"); setIsGenerateModalOpen(false); }} className="px-4 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800">Generate & Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeskSlipsPage;