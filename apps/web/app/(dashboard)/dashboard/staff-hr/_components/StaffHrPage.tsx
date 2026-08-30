"use client";
import React, { useState, useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import { 
  StaffMember, initialStaff,
  LeaveRequest, initialLeaves, LeaveStatus,
  PayrollRecord, initialPayroll, PayrollStatus,
  AttendanceRecord, initialAttendance,
  AppraisalRecord, initialAppraisals
} from '../_data/staffHrData';

type HrTabType = 'directory' | 'leaves' | 'attendance' | 'appraisals' | 'payroll';

const StaffHrPage = () => {
  const [activeTab, setActiveTab] = useState<HrTabType>('directory');
  
  // Reactive Data States
  const [staffData, setStaffData] = useState<StaffMember[]>(initialStaff);
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>(initialLeaves);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendance);
  const [appraisalData, setAppraisalData] = useState<AppraisalRecord[]>(initialAppraisals);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>(initialPayroll); // Restored!

  // Modal States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', department: '', contact: '' });

  // --- FUNCTIONAL MUTATION HANDLERS ---
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.role) return;
    
    const generatedEmpId = `EMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const entry: StaffMember = {
      id: Date.now().toString(),
      empId: generatedEmpId,
      name: newStaff.name,
      role: newStaff.role,
      department: newStaff.department,
      contact: newStaff.contact,
      status: 'Active'
    };
    
    setStaffData(prev => [...prev, entry]);
    setNewStaff({ name: '', role: '', department: '', contact: '' });
    setIsAddStaffOpen(false);
  };

  const handleUpdateLeave = (id: string, newStatus: LeaveStatus) => {
    setLeaveData(prev => prev.map(leave => leave.id === id ? { ...leave, status: newStatus } : leave));
  };

  const handlePunchAction = (id: string) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendanceData(prev => prev.map(record => {
      if (record.id === id) {
        if (!record.checkIn) return { ...record, checkIn: currentTime, status: 'Late' };
        if (!record.checkOut) return { ...record, checkOut: currentTime };
      }
      return record;
    }));
  };

  const handleCompleteAppraisal = (id: string) => {
    setAppraisalData(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'Completed', rating: 4.0, remarks: 'Standard review approved.' } : app
    ));
  };

  // Functional Payroll Handler
  const handleProcessPayroll = (id: string) => {
    setPayrollData(prev => prev.map(record => 
      record.id === id ? { ...record, status: 'Paid' } : record
    ));
  };

  // --- COLUMNS SETUP ---
  const directoryColumns = useMemo<ColumnDef<StaffMember>[]>(() => [
    { accessorKey: 'empId', header: 'Emp ID', cell: ({ row }) => <span className="font-bold text-xs text-gray-500 uppercase">{row.original.empId}</span> },
    { accessorKey: 'name', header: 'Staff Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.name}</span> },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <span className="text-sm font-medium text-gray-800">{row.original.role}</span> },
    { accessorKey: 'department', header: 'Department', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.department}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${s === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{s}</span>;
      }
    }
  ], []);

  const leaveColumns = useMemo<ColumnDef<LeaveRequest>[]>(() => [
    { accessorKey: 'staffName', header: 'Staff Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.staffName}</span> },
    { accessorKey: 'leaveType', header: 'Type', cell: ({ row }) => <span className="text-sm font-medium text-gray-800">{row.original.leaveType}</span> },
    { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.duration}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        let badge = 'bg-gray-50 text-gray-700';
        if (s === 'Approved') badge = 'bg-green-50 text-green-700 border-green-200';
        if (s === 'Pending') badge = 'bg-orange-50 text-orange-700 border-orange-200';
        if (s === 'Rejected') badge = 'bg-red-50 text-red-700 border-red-200';
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge}`}>{s}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        if (row.original.status !== 'Pending') return <span className="text-xs text-gray-400">Processed</span>;
        return (
          <div className="flex gap-2">
            <button onClick={() => handleUpdateLeave(row.original.id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-sm">Approve</button>
            <button onClick={() => handleUpdateLeave(row.original.id, 'Rejected')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-sm">Reject</button>
          </div>
        );
      }
    }
  ], []);

  const attendanceColumns = useMemo<ColumnDef<AttendanceRecord>[]>(() => [
    { accessorKey: 'staffName', header: 'Staff', cell: ({ row }) => <span className="font-semibold text-sm text-gray-900">{row.original.staffName}</span> },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.date}</span> },
    { 
      accessorKey: 'checkIn', 
      header: 'Check-In', 
      cell: ({ row }) => (
        <div className="flex flex-col">
          <svg className="w-4 h-4 text-gray-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>
          <span className="text-sm text-gray-900 font-medium">{row.original.checkIn || '—'}</span>
        </div>
      )
    },
    { accessorKey: 'checkOut', header: 'Check-Out', cell: ({ row }) => <span className="text-sm text-gray-900 font-medium">{row.original.checkOut || '—'}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        let badge = 'bg-red-50 text-red-700 border-red-200';
        if (s === 'Present') badge = 'bg-green-50 text-green-700 border-green-200';
        if (s === 'Late') badge = 'bg-orange-50 text-orange-700 border-orange-200';
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge}`}>{s}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        if (row.original.checkIn && row.original.checkOut) return <span className="text-xs text-gray-400">Completed</span>;
        return (
          <button 
            onClick={() => handlePunchAction(row.original.id)} 
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
          >
            {!row.original.checkIn ? 'Manual In' : 'Manual Out'}
          </button>
        );
      }
    }
  ], []);

  const appraisalColumns = useMemo<ColumnDef<AppraisalRecord>[]>(() => [
    { accessorKey: 'staffName', header: 'Staff Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.staffName}</span> },
    { accessorKey: 'period', header: 'Review Period', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.period}</span> },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => <span className="text-sm font-bold text-gray-900">{row.original.rating ? `${row.original.rating} / 5` : '—'}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${s === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{s}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        if (row.original.status === 'Completed') return <span className="text-xs text-gray-400">Reviewed</span>;
        return (
          <button onClick={() => handleCompleteAppraisal(row.original.id)} className="bg-[#1C263A] hover:bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
            Submit Review
          </button>
        );
      }
    }
  ], []);

  // Restored Payroll Columns
  const payrollColumns = useMemo<ColumnDef<PayrollRecord>[]>(() => [
    { accessorKey: 'staffName', header: 'Staff Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.staffName}</span> },
    { accessorKey: 'month', header: 'Month', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.month}</span> },
    { accessorKey: 'basicSalary', header: 'Basic (₹)', cell: ({ row }) => <span className="text-sm text-gray-600">₹{row.original.basicSalary.toLocaleString()}</span> },
    { accessorKey: 'netPay', header: 'Net Pay (₹)', cell: ({ row }) => <span className="text-sm font-bold text-green-700">₹{row.original.netPay.toLocaleString()}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const status: PayrollStatus = row.original.status;
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{status}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        if (row.original.status === 'Paid') return <span className="text-xs text-gray-400">Processed</span>;
        return (
          <button onClick={() => handleProcessPayroll(row.original.id)} className="bg-[#1C263A] hover:bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
            Process Payment
          </button>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Staff & HR</h1>
          <p className="text-sm text-gray-500">Manage employee directory, leave requests, attendance, appraisals, and payroll</p>
        </div>
        <button 
          onClick={() => setIsAddStaffOpen(true)}
          className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer ml-auto md:ml-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Staff
        </button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'directory', label: 'Directory' },
          { id: 'leaves', label: 'Leave management' },
          { id: 'appraisals', label: 'Performance appraisal' },
          { id: 'attendance', label: 'Biometric attendance' },
          { id: 'payroll', label: 'Payroll' }, // Restored Tab!
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HrTabType)}
            className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.id ? 'border-[#1C263A] text-[#1C263A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'directory' && <DataTable columns={directoryColumns} data={staffData} />}
        {activeTab === 'leaves' && <DataTable columns={leaveColumns} data={leaveData} />}
        {activeTab === 'appraisals' && <DataTable columns={appraisalColumns} data={appraisalData} />}
        {activeTab === 'attendance' && <DataTable columns={attendanceColumns} data={attendanceData} />}
        {activeTab === 'payroll' && <DataTable columns={payrollColumns} data={payrollData} />} {/* Restored Render! */}
      </div>

      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStaffSubmit} className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add New Staff Member</h3>
            <p className="text-xs text-gray-500">Enter employee details to generate HR record and ERP access.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <input required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} type="text" placeholder="Full Name" className="col-span-2 w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
              <input required value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} type="text" placeholder="Designation / Role" className="w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
              <select required value={newStaff.department} onChange={e => setNewStaff({...newStaff, department: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white cursor-pointer text-gray-700">
                <option value="">Select Department</option>
                <option value="Administration">Administration</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Support">Support</option>
              </select>
              <input required value={newStaff.contact} onChange={e => setNewStaff({...newStaff, contact: e.target.value})} type="text" placeholder="Contact Number" className="col-span-2 w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsAddStaffOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800">Save Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffHrPage;