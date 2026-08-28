export type HomeworkStatus = 'Pending' | 'Completed' | 'Overdue';

export interface Homework {
  id: string;
  subject: string;
  title: string;
  teacher: string;
  dueDate: string;
  status: HomeworkStatus;
  description: string;
}

export const homeworkList: Homework[] = [
  {
    id: '1',
    subject: 'Mathematics',
    title: 'Algebraic Expressions - Exercise 4.2',
    teacher: 'Anjali Sharma',
    dueDate: '2026-08-30',
    status: 'Pending',
    description: 'Solve all questions from 1 to 15 in your homework notebook.'
  },
  {
    id: '2',
    subject: 'Science',
    title: 'Chemical Reactions Report',
    teacher: 'Ramesh Iyer',
    dueDate: '2026-08-27',
    status: 'Overdue',
    description: 'Submit the lab report for the metal reactivity experiment.'
  },
  {
    id: '3',
    subject: 'English',
    title: 'Essay: The Future of AI',
    teacher: "Fiona D'Souza",
    dueDate: '2026-08-25',
    status: 'Completed',
    description: 'Write a 500-word essay on how AI will change education.'
  },
  {
    id: '4',
    subject: 'Social Studies',
    title: 'Map Work - Rivers of India',
    teacher: 'Kavita Bhatt',
    dueDate: '2026-09-02',
    status: 'Pending',
    description: 'Mark all major rivers on the provided political map.'
  }
];