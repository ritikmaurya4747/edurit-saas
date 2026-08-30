"use client";
import React, { useState, useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { 
  NoticeRecord, initialNotices,  
  NoticeAudience, NoticePriority 
} from '../_data/noticeData';

type NoticeTabType = 'active' | 'drafts' | 'archived';

const NoticeBoardPage = () => {
  const [activeTab, setActiveTab] = useState<NoticeTabType>('active');
  const [notices, setNotices] = useState<NoticeRecord[]>(initialNotices);
  
  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '', content: '', audience: 'All' as NoticeAudience, priority: 'Info' as NoticePriority
  });

  // Filtered Data based on Active Tab
  const filteredNotices = useMemo(() => {
    if (activeTab === 'active') return notices.filter(n => n.status === 'Active');
    if (activeTab === 'drafts') return notices.filter(n => n.status === 'Draft');
    if (activeTab === 'archived') return notices.filter(n => n.status === 'Archived');
    return notices;
  }, [notices, activeTab]);

  // --- FUNCTIONAL HANDLERS ---
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    
    const today = new Date().toISOString().split('T')[0] || '';
    const entry: NoticeRecord = {
      id: Date.now().toString(),
      title: newNotice.title,
      content: newNotice.content,
      audience: newNotice.audience,
      priority: newNotice.priority,
      datePosted: today,
      status: 'Active' // Defaulting new creations to Active
    };
    
    setNotices(prev => [entry, ...prev]);
    setNewNotice({ title: '', content: '', audience: 'All', priority: 'Info' });
    setIsCreateOpen(false);
  };

  const handleArchive = (id: string) => {
    setNotices(prev => prev.map(notice => 
      notice.id === id ? { ...notice, status: 'Archived' } : notice
    ));
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this notice?")) {
      setNotices(prev => prev.filter(notice => notice.id !== id));
    }
  };

  // --- COLUMNS SETUP ---
  const columns = useMemo<ColumnDef<NoticeRecord>[]>(() => [
    { 
      accessorKey: 'title', 
      header: 'Notice Title', 
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-gray-900">{row.original.title}</span>
          <span className="text-xs text-gray-500 truncate max-w-62.5">{row.original.content}</span>
        </div>
      ) 
    },
    { 
      accessorKey: 'priority', 
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority;
        let badge = 'bg-blue-50 text-blue-700 border-blue-200';
        if (p === 'Alert') badge = 'bg-red-50 text-red-700 border-red-200';
        if (p === 'Event') badge = 'bg-purple-50 text-purple-700 border-purple-200';
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge}`}>{p}</span>;
      }
    },
    { 
      accessorKey: 'audience', 
      header: 'Target Audience', 
      cell: ({ row }) => <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{row.original.audience}</span> 
    },
    { accessorKey: 'datePosted', header: 'Date Posted', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.datePosted}</span> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status !== 'Archived' && (
            <button 
              onClick={() => handleArchive(row.original.id)} 
              className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
            >
              Archive
            </button>
          )}
          <button 
            onClick={() => handleDelete(row.original.id)} 
            className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Notice Board</h1>
          <p className="text-sm text-gray-500">Create, manage, and broadcast announcements across the school</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer ml-auto md:ml-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Notice
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'active', label: 'Active Notices' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as NoticeTabType)}
            className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.id ? 'border-[#1C263A] text-[#1C263A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notice Data Table */}
      <div>
        <DataTable columns={columns} data={filteredNotices} />
      </div>

      {/* Create Notice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create New Notice</h3>
            <p className="text-xs text-gray-500">Draft an announcement to be broadcasted to your selected audience.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Title</label>
                <input required value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} type="text" placeholder="e.g., Holiday on Monday" className="w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Content / Description</label>
                <textarea required value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} rows={3} placeholder="Enter full details here..." className="w-full border border-gray-200 p-2.5 rounded-lg text-sm resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                  <select value={newNotice.audience} onChange={e => setNewNotice({...newNotice, audience: e.target.value as NoticeAudience})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white cursor-pointer text-gray-700">
                    <option value="All">All (School-wide)</option>
                    <option value="Staff Only">Staff Only</option>
                    <option value="Students">Students</option>
                    <option value="Parents">Parents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Type</label>
                  <select value={newNotice.priority} onChange={e => setNewNotice({...newNotice, priority: e.target.value as NoticePriority})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white cursor-pointer text-gray-700">
                    <option value="Info">General Info</option>
                    <option value="Alert">Important Alert</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800">Publish Notice</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardPage;