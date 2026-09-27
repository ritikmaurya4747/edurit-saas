export interface SubjectGrade {
  id: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks: string;
}

export interface StudentReport {
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  term: string;
  academicYear: string;
  attendance: number;
  totalWorkingDays: number;
  subjects: SubjectGrade[];
}

export const reportData: StudentReport = {
  studentName: "Aarav Patel",
  rollNumber: "8B-04",
  className: "Class 8",
  section: "B",
  term: "Mid-Term Examination",
  academicYear: "2026-2027",
  attendance: 92,
  totalWorkingDays: 105,
  subjects: [
    { id: '1', subject: 'English', totalMarks: 100, obtainedMarks: 85, grade: 'A2', remarks: 'Excellent comprehension skills.' },
    { id: '2', subject: 'Hindi', totalMarks: 100, obtainedMarks: 78, grade: 'B1', remarks: 'Good, but needs practice in grammar.' },
    { id: '3', subject: 'Mathematics', totalMarks: 100, obtainedMarks: 94, grade: 'A1', remarks: 'Outstanding logical reasoning.' },
    { id: '4', subject: 'Science', totalMarks: 100, obtainedMarks: 88, grade: 'A2', remarks: 'Shows great interest in practicals.' },
    { id: '5', subject: 'Social Studies', totalMarks: 100, obtainedMarks: 82, grade: 'A2', remarks: 'Consistent performance.' },
    { id: '6', subject: 'Computer Science', totalMarks: 50, obtainedMarks: 48, grade: 'A1', remarks: 'Brilliant programming concepts.' },
  ]
};