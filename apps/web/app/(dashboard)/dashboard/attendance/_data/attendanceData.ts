export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Unmarked';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  status: AttendanceStatus;
  parentContact: string; // Added for the emergency call feature
}

export const initialStudents: Student[] = [
  { id: '1', rollNo: '8B-01', name: 'Aarav Patel', status: 'Present', parentContact: '+919876543210' },
  { id: '2', rollNo: '8B-02', name: 'Ananya Sharma', status: 'Present', parentContact: '+919876543211' },
  { id: '3', rollNo: '8B-03', name: 'Kabir Singh', status: 'Present', parentContact: '+919876543212' },
  { id: '4', rollNo: '8B-04', name: 'Diya Reddy', status: 'Present', parentContact: '+919876543213' },
  { id: '5', rollNo: '8B-05', name: 'Ishaan Gupta', status: 'Present', parentContact: '+919876543214' },
  { id: '6', rollNo: '8B-06', name: 'Neha Desai', status: 'Present', parentContact: '+919876543215' },
];