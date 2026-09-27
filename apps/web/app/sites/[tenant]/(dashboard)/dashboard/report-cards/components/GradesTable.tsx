"use client";
import React, { useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { SubjectGrade } from '../data/reportCardData'; 

const GradesTable = ({ subjects }: { subjects: SubjectGrade[] }) => {
  
  const columns = useMemo<ColumnDef<SubjectGrade>[]>(() => [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.subject}</span>
      ),
    },
    {
      accessorKey: 'totalMarks',
      header: 'Total Marks',
      cell: ({ row }) => (
        <div className="text-center">{row.original.totalMarks}</div>
      ),
    },
    {
      accessorKey: 'obtainedMarks',
      header: 'Obtained',
      cell: ({ row }) => (
        <div className="text-center font-bold text-gray-900">
          {row.original.obtainedMarks}
        </div>
      ),
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => (
        <div className="text-center font-bold text-indigo-700">
          {row.original.grade}
        </div>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">{row.original.remarks}</span>
      ),
    },
  ], []);

  return (
    <div className="mb-8">
      <DataTable columns={columns} data={subjects} />
    </div>
  );
};

export default GradesTable;