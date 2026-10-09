"use client";

import { useMemo } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { fmtMarks, type ReportCardDetail } from "../../exams/api";

type SubjectRow = ReportCardDetail["subjects"][number];

const GradesTable = ({ subjects }: { subjects: SubjectRow[] }) => {
  const columns = useMemo<ColumnDef<SubjectRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Subject",
        cell: ({ row }) => <span className="font-semibold text-gray-900">{row.original.name}</span>,
      },
      {
        accessorKey: "maxMarks",
        header: "Max Marks",
        cell: ({ row }) => <div className="text-center">{fmtMarks(row.original.maxMarks)}</div>,
      },
      {
        accessorKey: "marksObtained",
        header: "Obtained",
        cell: ({ row }) => {
          const { marksObtained, passed } = row.original;
          return (
            <div className={`text-center font-bold ${marksObtained === null ? "text-gray-400" : passed ? "text-gray-900" : "text-red-600"}`}>
              {marksObtained === null ? "AB" : fmtMarks(marksObtained)}
            </div>
          );
        },
      },
      {
        accessorKey: "grade",
        header: "Grade",
        cell: ({ row }) => <div className="text-center font-bold text-indigo-700">{row.original.grade ?? "—"}</div>,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.remarks || ""}</span>,
      },
    ],
    [],
  );

  return (
    <div className="mb-8 print-avoid-break">
      <DataTable columns={columns} data={subjects} />
    </div>
  );
};

export default GradesTable;
