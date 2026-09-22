export type SlipStatus = 'Generated' | 'Printed' | 'Assigned';

export interface DeskSlip {
  id: string;
  rollNo: string;
  studentName: string;
  className: string;
  examName: string;
  roomNo: string;
  seatNo: string;
  status: SlipStatus;
}

export const initialDeskSlips: DeskSlip[] = [
  { id: '1', rollNo: 'RN-2026-101', studentName: 'Aarav Sharma', className: 'Class 10-A', examName: 'Mid-Term Exam 2026', roomNo: 'Hall 01', seatNo: 'A-12', status: 'Printed' },
  { id: '2', rollNo: 'RN-2026-102', studentName: 'Priya Verma', className: 'Class 10-A', examName: 'Mid-Term Exam 2026', roomNo: 'Hall 01', seatNo: 'A-13', status: 'Generated' },
  { id: '3', rollNo: 'RN-2026-103', studentName: 'Rahul Iyer', className: 'Class 10-B', examName: 'Mid-Term Exam 2026', roomNo: 'Hall 02', seatNo: 'B-04', status: 'Assigned' },
  { id: '4', rollNo: 'RN-2026-104', studentName: 'Sneha Kulkarni', className: 'Class 12-Science', examName: 'Mid-Term Exam 2026', roomNo: 'Lab 01', seatNo: 'L-01', status: 'Printed' },
];