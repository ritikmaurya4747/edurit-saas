export type StaffStatus = 'Active' | 'On Leave' | 'Inactive';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type PayrollStatus = 'Paid' | 'Processing';
export type AttendanceStatus = 'Present' | 'Late' | 'Absent';
export type AppraisalStatus = 'Pending Review' | 'Completed';

export interface StaffMember {
  id: string; empId: string; name: string; role: string; department: string; contact: string; status: StaffStatus;
}
export interface LeaveRequest {
  id: string; staffName: string; leaveType: string; duration: string; reason: string; status: LeaveStatus;
}
export interface PayrollRecord {
  id: string; staffName: string; month: string; basicSalary: number; netPay: number; status: PayrollStatus;
}
export interface AttendanceRecord {
  id: string; staffName: string; date: string; checkIn: string | null; checkOut: string | null; status: AttendanceStatus;
}
export interface AppraisalRecord {
  id: string; staffName: string; period: string; rating: number | null; remarks: string; status: AppraisalStatus;
}

// Initial Data Arrays
export const initialStaff: StaffMember[] = [
  { id: '1', empId: 'EMP-001', name: 'Dr. Rajeev Nair', role: 'Principal', department: 'Administration', contact: '+91 9876500001', status: 'Active' },
  { id: '2', empId: 'EMP-012', name: 'Meera Rajput', role: 'Senior Teacher', department: 'Science', contact: '+91 9876500012', status: 'Active' },
];

export const initialLeaves: LeaveRequest[] = [
  { id: '1', staffName: 'Sanjay Gupta', leaveType: 'Medical Leave', duration: '2026-08-30 to 2026-09-02 (4 Days)', reason: 'Viral Fever', status: 'Pending' },
];

export const initialPayroll: PayrollRecord[] = [
  { id: '1', staffName: 'Dr. Rajeev Nair', month: 'August 2026', basicSalary: 120000, netPay: 110500, status: 'Processing' },
];

export const initialAttendance: AttendanceRecord[] = [
  { id: '1', staffName: 'Anjali Sharma', date: '2026-08-19', checkIn: '7:52 AM', checkOut: '3:40 PM', status: 'Present' },
  { id: '2', staffName: 'Ramesh Iyer', date: '2026-08-19', checkIn: '8:04 AM', checkOut: '3:38 PM', status: 'Late' },
  { id: '3', staffName: "Fiona D'Souza", date: '2026-08-19', checkIn: null, checkOut: null, status: 'Absent' },
  { id: '4', staffName: 'Kavita Bhatt', date: '2026-08-19', checkIn: '7:48 AM', checkOut: '3:42 PM', status: 'Present' },
];

export const initialAppraisals: AppraisalRecord[] = [
  { id: '1', staffName: 'Meera Rajput', period: '2025-2026', rating: 4.5, remarks: 'Excellent student feedback.', status: 'Completed' },
  { id: '2', staffName: 'Sanjay Gupta', period: '2025-2026', rating: null, remarks: '-', status: 'Pending Review' },
];