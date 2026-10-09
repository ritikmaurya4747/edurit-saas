"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { EXAM_INVALIDATE, type ExamListItem, type SeatItem } from "../../exams/api";
import PrintStyles from "../../exams/components/PrintStyles";

const PRINT_ID = "desk-slips-print";

// Printable grid of desk slips (2 per row, cut along the dashed lines).
const DeskSlipsPrint = ({ exam, seats, onBack }: { exam: ExamListItem; seats: SeatItem[]; onBack: () => void }) => {
  const user = useUser();
  const can = useCan();
  const markPrinted = useApiMutation(
    () => api.post<{ updated: number }>(`exams/${exam.id}/seating/mark-printed`, { seatIds: seats.map((s) => s.id) }),
    { invalidate: EXAM_INVALIDATE, success: (r) => `${r.updated} slip(s) marked as printed` },
  );

  const print = () => {
    window.print();
    if (can(PERMISSIONS.EXAM_CREATE)) markPrinted.mutate();
  };

  return (
    <div>
      <PrintStyles targetId={PRINT_ID} pageMargin="8mm" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to seating
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">{seats.length} slip(s)</span>
          <Button onClick={print} loading={markPrinted.isPending} disabled={!seats.length}>
            <Printer className="h-4 w-4" /> Print slips
          </Button>
        </div>
      </div>

      <div id={PRINT_ID} className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className="print-avoid-break rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 print:rounded-none print:p-3"
          >
            <div className="mb-3 border-b border-gray-200 pb-2 text-center">
              <p className="font-serif text-base font-black uppercase tracking-tight text-gray-900">{user?.tenantName}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">Examination Desk Slip</p>
              <p className="text-xs font-semibold text-gray-700">
                {exam.name} · {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
              </p>
            </div>

            <div className="flex items-stretch gap-3">
              <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="col-span-2">
                  <span className="block text-[10px] font-medium text-gray-500">Student Name</span>
                  <span className="text-sm font-bold text-gray-900">{seat.student.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-500">Admission No</span>
                  <span className="font-bold text-gray-900">{seat.student.admissionNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-500">Roll No</span>
                  <span className="font-bold text-gray-900">{seat.student.rollNumber ?? "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-medium text-gray-500">Class &amp; Section</span>
                  <span className="font-semibold text-gray-800">{seat.sectionLabel ?? "—"}</span>
                </div>
              </div>
              <div className="flex w-28 flex-col items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-2 text-center print:border-gray-400 print:bg-gray-100">
                <span className="text-[10px] font-medium text-indigo-600 print:text-gray-600">Room</span>
                <span className="text-sm font-bold text-indigo-900 print:text-black">{seat.roomNumber}</span>
                <span className="mt-1 text-[10px] font-medium text-indigo-600 print:text-gray-600">Seat</span>
                <span className="text-xl font-black text-indigo-900 print:text-black">{seat.seatNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeskSlipsPrint;
