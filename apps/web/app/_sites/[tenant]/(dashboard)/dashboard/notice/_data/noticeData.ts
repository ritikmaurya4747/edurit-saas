export type NoticeAudience = 'All' | 'Staff Only' | 'Students' | 'Parents';
export type NoticePriority = 'Info' | 'Alert' | 'Event';
export type NoticeStatus = 'Active' | 'Draft' | 'Archived';

export interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  audience: NoticeAudience;
  priority: NoticePriority;
  datePosted: string;
  status: NoticeStatus;
}

export const initialNotices: NoticeRecord[] = [
  {
    id: '1',
    title: 'Upcoming Mid-Term Examinations',
    content: 'Mid-term exams will commence from 15th September. Timetable is attached.',
    audience: 'All',
    priority: 'Alert',
    datePosted: '2026-08-25',
    status: 'Active'
  },
  {
    id: '2',
    title: 'Staff Meeting on Saturday',
    content: 'Mandatory staff meeting to discuss annual day preparations.',
    audience: 'Staff Only',
    priority: 'Info',
    datePosted: '2026-08-26',
    status: 'Active'
  },
  {
    id: '3',
    title: 'Annual Sports Day 2026',
    content: 'Get ready for the biggest sports event of the year!',
    audience: 'All',
    priority: 'Event',
    datePosted: '2026-08-28',
    status: 'Draft'
  },
  {
    id: '4',
    title: 'Fee Submission Deadline Extended',
    content: 'The last date to submit the term fee has been extended by 5 days.',
    audience: 'Parents',
    priority: 'Info',
    datePosted: '2026-08-01',
    status: 'Archived'
  }
];