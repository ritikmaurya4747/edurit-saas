export const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const scheduleData = [
  [
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800' },
    { subject: 'Art', teacher: 'N. Ghosh', color: 'bg-red-500' },
    { subject: 'Hindi', teacher: 'P. Naik', color: 'bg-red-800' },
    { subject: 'Social Studies', teacher: 'K. Bhatt', color: 'bg-purple-600' },
    { subject: 'Science', teacher: 'R. Iyer', color: 'bg-emerald-700' },
    { subject: 'PE', teacher: 'T. Singh', color: 'bg-emerald-600' },
  ],
  [
    { subject: 'Science', teacher: 'R. Iyer', color: 'bg-emerald-700' },
    { subject: 'PE', teacher: 'T. Singh', color: 'bg-emerald-600' },
    { subject: 'Computer', teacher: 'V. Rao', color: 'bg-blue-900' },
    { subject: 'Marathi', teacher: 'S. Joshi', color: 'bg-yellow-600' },
    { subject: 'English', teacher: 'F. D\'Souza', color: 'bg-indigo-900' },
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800' },
  ],
  [
    { subject: 'English', teacher: 'F. D\'Souza', color: 'bg-indigo-900' },
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800' },
    { subject: 'Art', teacher: 'N. Ghosh', color: 'bg-red-500' },
    { subject: 'Hindi', teacher: 'P. Naik', color: 'bg-red-800' },
    { subject: 'Social Studies', teacher: 'K. Bhatt', color: 'bg-purple-600' },
    { subject: 'Science', teacher: 'R. Iyer', color: 'bg-emerald-700' },
  ],
  [
    { subject: 'Social Studies', teacher: 'K. Bhatt', color: 'bg-purple-600' },
    { subject: 'Science', teacher: 'R. Iyer', color: 'bg-emerald-700' },
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800', isConflict: true },
    { subject: 'Computer', teacher: 'V. Rao', color: 'bg-blue-900' },
    { subject: 'Marathi', teacher: 'S. Joshi', color: 'bg-yellow-600' },
    { subject: 'English', teacher: 'F. D\'Souza', color: 'bg-indigo-900' },
  ],
  [
    { subject: 'Marathi', teacher: 'S. Joshi', color: 'bg-yellow-600' },
    { subject: 'English', teacher: 'F. D\'Souza', color: 'bg-indigo-900' },
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800' },
    { subject: 'Art', teacher: 'N. Ghosh', color: 'bg-red-500' },
    { subject: 'Hindi', teacher: 'P. Naik', color: 'bg-red-800' },
    { subject: 'Social Studies', teacher: 'K. Bhatt', color: 'bg-purple-600' },
  ],
  [
    { subject: 'Hindi', teacher: 'P. Naik', color: 'bg-red-800' },
    { subject: 'Social Studies', teacher: 'K. Bhatt', color: 'bg-purple-600' },
    { subject: 'Science', teacher: 'R. Iyer', color: 'bg-emerald-700' },
    { subject: 'PE', teacher: 'T. Singh', color: 'bg-emerald-600' },
    { subject: 'Computer', teacher: 'V. Rao', color: 'bg-blue-900' },
    { subject: 'Marathi', teacher: 'S. Joshi', color: 'bg-yellow-600' },
  ],
  [
    { subject: 'Computer', teacher: 'V. Rao', color: 'bg-blue-900' },
    { subject: 'Marathi', teacher: 'S. Joshi', color: 'bg-yellow-600' },
    { subject: 'English', teacher: 'F. D\'Souza', color: 'bg-indigo-900' },
    { subject: 'Mathematics', teacher: 'A. Sharma', color: 'bg-blue-800' },
    { subject: 'Art', teacher: 'N. Ghosh', color: 'bg-red-500' },
    { subject: 'Hindi', teacher: 'P. Naik', color: 'bg-red-800' },
  ]
];

export interface LessonPlan {
  id: string;
  subject: string;
  teacher: string;
  className: string;
  completedTopics: number;
  totalTopics: number;
  colorClass: string;
}

export const lessonPlans: LessonPlan[] = [
  {
    id: '1',
    subject: 'Mathematics',
    teacher: 'Anjali Sharma',
    className: 'Class 8 - B',
    completedTopics: 24,
    totalTopics: 32,
    colorClass: 'bg-blue-800'
  },
  {
    id: '2',
    subject: 'Science',
    teacher: 'Ramesh Iyer',
    className: 'Class 8 - B',
    completedTopics: 29,
    totalTopics: 30,
    colorClass: 'bg-emerald-700'
  },
  {
    id: '3',
    subject: 'English',
    teacher: "Fiona D'Souza",
    className: 'Class 8 - B',
    completedTopics: 18,
    totalTopics: 28,
    colorClass: 'bg-red-800'
  },
  {
    id: '4',
    subject: 'Social Studies',
    teacher: 'Kavita Bhatt',
    className: 'Class 8 - B',
    completedTopics: 20,
    totalTopics: 26,
    colorClass: 'bg-purple-600'
  }
];