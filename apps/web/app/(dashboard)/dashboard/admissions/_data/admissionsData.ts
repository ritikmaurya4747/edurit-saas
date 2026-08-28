export interface PipelineCard {
  id: string;
  name: string;
  classApplied: string;
  source: string;
}

export interface PipelineStage {
  title: string;
  count: number;
  cards: PipelineCard[];
}

export const pipelineData: PipelineStage[] = [
  {
    title: 'Enquiry', count: 2, cards: [
      { id: '1', name: 'Sahil Verma', classApplied: 'Nursery', source: 'Website' },
      { id: '2', name: 'Riya Kapoor', classApplied: 'Class 1', source: 'Referral' }
    ]
  },
  {
    title: 'Document Verification', count: 2, cards: [
      { id: '3', name: 'Arnav Mehta', classApplied: 'Class 6', source: 'Walk-in' },
      { id: '4', name: 'Tanvi Pillai', classApplied: 'Class 3', source: 'Website' }
    ]
  },
  {
    title: 'Entrance Test', count: 1, cards: [
      { id: '5', name: 'Yash Agarwal', classApplied: 'Class 9', source: 'Referral' }
    ]
  },
  {
    title: 'Offer Sent', count: 1, cards: [
      { id: '6', name: 'Naisha Bhatt', classApplied: 'Class 1', source: 'Website' }
    ]
  },
  {
    title: 'Admitted', count: 1, cards: [
      { id: '7', name: 'Devansh Rao', classApplied: 'Class 5', source: 'Walk-in' }
    ]
  }
];

export interface WaitlistEntry {
  id: string;
  className: string;
  position: string;
  name: string;
  waitingSince: string;
  status: 'Pending' | 'Approved';
}

export const waitlistData: WaitlistEntry[] = [
  { id: '1', className: 'Class 2', position: '#1', name: 'Kabir Deshpande', waitingSince: '2026-07-02', status: 'Pending' },
  { id: '2', className: 'Class 2', position: '#2', name: 'Sara Fernandes', waitingSince: '2026-07-05', status: 'Pending' },
  { id: '3', className: 'Nursery', position: '#1', name: 'Om Bansal', waitingSince: '2026-07-10', status: 'Pending' },
  { id: '4', className: 'Class 6', position: '#1', name: 'Ira Chatterjee', waitingSince: '2026-07-11', status: 'Approved' },
];

export interface EntranceTest {
  id: string;
  className: string;
  date: string;
  time: string;
  venue: string;
  registered: string;
}

export const entranceTestsData: EntranceTest[] = [
  { id: '1', className: 'Class 9', date: '2026-09-05', time: '10:00 AM', venue: 'Main Hall', registered: '18/30' },
  { id: '2', className: 'Nursery', date: '2026-09-10', time: '9:30 AM', venue: 'Junior Block', registered: '24/40' },
];