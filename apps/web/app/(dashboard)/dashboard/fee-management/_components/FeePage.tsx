"use client";
import React, { useState, useMemo } from 'react';
import { ColumnDef, DataTable } from '@repo/ui';
import FeeHeader from './FeeHeader';
import { 
  FeeInvoice, initialInvoices, 
  FeeStructure, initialStructures,
  EmiPlan, initialEmiPlans,
  RefundRecord, initialRefunds,
  ReceiptRecord, initialReceipts
} from '../_data/feeData';

type FeeTabType = 'dues' | 'structures' | 'emi' | 'refunds' | 'receipts';

const FeePage = () => {
  const [activeTab, setActiveTab] = useState<FeeTabType>('dues');
  const [invoices, setInvoices] = useState<FeeInvoice[]>(initialInvoices);
  // Interactive Modal States for Actionable UX
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  console.log(setInvoices,selectedInvoice)

  const tabs = [
    { id: 'dues', label: 'Student dues' },
    { id: 'structures', label: 'Fee structures' },
    { id: 'emi', label: 'EMI plans' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'receipts', label: 'Receipts' },
  ];

  // --- ACTION HANDLERS ---
  const handleRecordPayment = (invoice: FeeInvoice) => {
    setSelectedInvoice(invoice);
    // Actionable trigger: Open payment modal or process
    alert(`action: Recording payment for ${invoice.studentName} (${invoice.invoiceNo})`);
  };

  // 1. Student Dues Columns
  const duesColumns = useMemo<ColumnDef<FeeInvoice>[]>(() => [
    { accessorKey: 'invoiceNo', header: 'Invoice No', cell: ({ row }) => <span className="font-bold text-xs text-gray-500 uppercase">{row.original.invoiceNo}</span> },
    { accessorKey: 'studentName', header: 'Student Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.studentName}</span> },
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.className}</span> },
    { accessorKey: 'totalAmount', header: 'Total (₹)', cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">₹{row.original.totalAmount.toLocaleString()}</span> },
    { accessorKey: 'paidAmount', header: 'Paid (₹)', cell: ({ row }) => <span className="text-sm font-semibold text-green-600">₹{row.original.paidAmount.toLocaleString()}</span> },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.dueDate}</span> },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let badge = 'bg-gray-50 text-gray-700 border-gray-200';
        if (status === 'Paid') badge = 'bg-green-50 text-green-700 border-green-200';
        if (status === 'Pending') badge = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        if (status === 'Overdue') badge = 'bg-red-50 text-red-700 border-red-200';
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge}`}>{status}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <button 
          onClick={() => handleRecordPayment(row.original)}
          className="bg-[#1C263A] hover:bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-sm"
        >
          Record Payment
        </button>
      ),
    }
  ], []);

  // 2. Fee Structures Columns
  const structureColumns = useMemo<ColumnDef<FeeStructure>[]>(() => [
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.className}</span> },
    { accessorKey: 'tuitionFee', header: 'Tuition Fee', cell: ({ row }) => <span>₹{row.original.tuitionFee.toLocaleString()}</span> },
    { accessorKey: 'transportFee', header: 'Transport', cell: ({ row }) => <span>₹{row.original.transportFee.toLocaleString()}</span> },
    { accessorKey: 'labFee', header: 'Lab Fee', cell: ({ row }) => <span>₹{row.original.labFee.toLocaleString()}</span> },
    { accessorKey: 'totalAnnual', header: 'Total Annual', cell: ({ row }) => <span className="font-bold text-gray-900">₹{row.original.totalAnnual.toLocaleString()}</span> },
    {
      id: 'actions',
      header: 'Action',
      cell: () => (
        <button onClick={() => alert("Opening Fee Structure configuration editor...")} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
          Edit Structure
        </button>
      )
    }
  ], []);

  // 3. EMI Plans Columns
  const emiColumns = useMemo<ColumnDef<EmiPlan>[]>(() => [
    { accessorKey: 'studentName', header: 'Student Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.studentName}</span> },
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.className}</span> },
    { accessorKey: 'totalInstallments', header: 'Installments', cell: ({ row }) => <span className="text-sm">{row.original.paidInstallments} / {row.original.totalInstallments} Paid</span> },
    { accessorKey: 'nextInstallmentAmount', header: 'Next Due (₹)', cell: ({ row }) => <span className="font-semibold text-orange-600">₹{row.original.nextInstallmentAmount.toLocaleString()}</span> },
    { accessorKey: 'nextDueDate', header: 'Next Due Date', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.nextDueDate}</span> },
    {
      id: 'actions',
      header: 'Action',
      cell: () => (
        <button onClick={() => alert("Processing next EMI installment collection...")} className="bg-[#1C263A] hover:bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
          Collect EMI
        </button>
      )
    }
  ], []);

  // 4. Refunds Columns
  const refundColumns = useMemo<ColumnDef<RefundRecord>[]>(() => [
    { accessorKey: 'studentName', header: 'Student Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.studentName}</span> },
    { accessorKey: 'className', header: 'Class', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.className}</span> },
    { accessorKey: 'amount', header: 'Refund Amount', cell: ({ row }) => <span className="font-semibold text-red-600">₹{row.original.amount.toLocaleString()}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.reason}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <span className="text-xs font-bold px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">{row.original.status}</span> },
    {
      id: 'actions',
      header: 'Action',
      cell: () => (
        <button onClick={() => alert("Approving and initiating bank transfer refund...")} className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
          Approve Refund
        </button>
      )
    }
  ], []);

  // 5. Receipts Columns
  const receiptColumns = useMemo<ColumnDef<ReceiptRecord>[]>(() => [
    { accessorKey: 'receiptNo', header: 'Receipt No', cell: ({ row }) => <span className="font-bold text-xs text-gray-500 uppercase">{row.original.receiptNo}</span> },
    { accessorKey: 'studentName', header: 'Student Name', cell: ({ row }) => <span className="font-bold text-sm text-gray-900">{row.original.studentName}</span> },
    { accessorKey: 'amountPaid', header: 'Amount Paid', cell: ({ row }) => <span className="font-semibold text-green-600">₹{row.original.amountPaid.toLocaleString()}</span> },
    { accessorKey: 'paymentMode', header: 'Mode', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.paymentMode}</span> },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.date}</span> },
    {
      id: 'actions',
      header: 'Download',
      cell: ({ row }) => (
        <button onClick={() => alert(`Downloading PDF receipt for ${row.original.receiptNo}...`)} className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PDF
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header with Actionable Collect Fee trigger */}
     <FeeHeader onCollectClick={() => setIsCollectFeeOpen(true)} />

      {/* Enterprise Tabs Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FeeTabType)}
            className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'border-[#1C263A] text-[#1C263A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Actionable Tables */}
      <div>
        {activeTab === 'dues' && <DataTable columns={duesColumns} data={invoices} />}
        {activeTab === 'structures' && <DataTable columns={structureColumns} data={initialStructures} />}
        {activeTab === 'emi' && <DataTable columns={emiColumns} data={initialEmiPlans} />}
        {activeTab === 'refunds' && <DataTable columns={refundColumns} data={initialRefunds} />}
        {activeTab === 'receipts' && <DataTable columns={receiptColumns} data={initialReceipts} />}
      </div>

      {/* Actionable Modal Mock */}
      {isCollectFeeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">New Fee Collection</h3>
            <p className="text-xs text-gray-500">Enter student details and amount to process cash/online collection.</p>
            <div className="space-y-3">
              <input type="text" placeholder="Student Roll No / Name" className="w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
              <input type="number" placeholder="Amount (₹)" className="w-full border border-gray-200 p-2.5 rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsCollectFeeOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert("Fee collected successfully!"); setIsCollectFeeOpen(false); }} className="px-4 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800">Submit Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePage;