"use client";

import { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, EmptyState } from "@/components/ui";
import type { EnrollmentHistoryItem, StudentProfile } from "../../types";

const EnrollmentTab = ({
  student,
  canManage,
  onChangeSection,
}: {
  student: StudentProfile;
  canManage: boolean;
  onChangeSection: () => void;
}) => {
  const columns = useMemo<ColumnDef<EnrollmentHistoryItem>[]>(
    () => [
      {
        id: "year",
        header: "Academic year",
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-bold text-gray-900">
            {row.original.academicYear.name}
            {row.original.academicYear.isCurrent && <Badge tone="green">Current</Badge>}
          </span>
        ),
      },
      { id: "class", header: "Class", cell: ({ row }) => row.original.class.name },
      { id: "section", header: "Section", cell: ({ row }) => row.original.section.name },
      {
        id: "roll",
        header: "Roll no.",
        cell: ({ row }) => <span className="font-bold">{row.original.rollNumber ?? "—"}</span>,
      },
    ],
    [],
  );

  const action = canManage && (
    <Button onClick={onChangeSection}>
      <ArrowRightLeft className="h-4 w-4" /> {student.currentEnrollment ? "Change section" : "Enrol in a section"}
    </Button>
  );

  return (
    <div>
      {student.enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments"
          description="This student is not enrolled in any class yet."
          action={action}
        />
      ) : (
        <>
          {action && <div className="mb-4 flex justify-end">{action}</div>}
          <DataTable columns={columns} data={student.enrollments} />
        </>
      )}
    </div>
  );
};

export default EnrollmentTab;
