"use client";
import React, { useState } from 'react';
import { AttendanceStatus, initialStudents, Student } from '../_data/attendanceData';
import { DataTable } from '@repo/ui/components/DataTable';
import { ColumnDef } from '@repo/ui';


export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setStudents(prev => 
      prev.map(student => student.id === id ? { ...student, status } : student)
    );
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'rollNo',
      header: 'Roll No',
      cell: ({ row }) => <span className="font-medium">{row.original.rollNo}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Student Name',
      cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.name}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Attendance Status',
      cell: ({ row }) => {
        const student = row.original;
        const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half-day'];
        
        return (
          <div className="flex gap-2">
            {statuses.map((status) => (
              <button 
                key={status}
                onClick={() => handleStatusChange(student.id, status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 border ${
                  student.status === status
                    ? status === 'Present' ? 'border-green-600 bg-green-600 text-white'
                    : status === 'Absent' ? 'border-red-600 bg-red-600 text-white'
                    : status === 'Late' ? 'border-yellow-500 bg-yellow-500 text-white'
                    : 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'parentContact',
      header: 'Emergency',
      cell: ({ row }) => (
        <a 
          href={`tel:${row.original.parentContact}`}
          className="flex items-center justify-center w-9 h-9 rounded-md border border-[#EBE3D8] hover:bg-[#FDFBF9] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C96860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
            <path d="M14.05 6A5 5 0 0 1 18 10"></path>
          </svg>
        </a>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Yahan aapka AttendanceHeader component aa jayega */}
      <DataTable columns={columns} data={students} />
    </div>
  );
}