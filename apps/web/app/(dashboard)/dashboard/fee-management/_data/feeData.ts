// types and mock data for all fee tabs
export type FeeStatus = 'Paid' | 'Pending' | 'Overdue';

export interface FeeInvoice {
  id: string; invoiceNo: string; studentName: string; className: string; totalAmount: number; paidAmount: number; dueDate: string; status: FeeStatus;
}
export interface FeeStructure {
  id: string; className: string; tuitionFee: number; transportFee: number; labFee: number; totalAnnual: number;
}
export interface EmiPlan {
  id: string; studentName: string; className: string; totalInstallments: number; paidInstallments: number; nextInstallmentAmount: number; nextDueDate: string;
}
export interface RefundRecord {
  id: string; studentName: string; className: string; amount: number; reason: string; status: string;
}
export interface ReceiptRecord {
  id: string; receiptNo: string; studentName: string; amountPaid: number; paymentMode: string; date: string;
}

export const initialInvoices: FeeInvoice[] = [
  { id: '1', invoiceNo: 'INV-2026-001', studentName: 'Aarav Patel', className: 'Class 8-B', totalAmount: 25000, paidAmount: 25000, dueDate: '2026-04-10', status: 'Paid' },
  { id: '2', invoiceNo: 'INV-2026-002', studentName: 'Ananya Sharma', className: 'Class 8-B', totalAmount: 25000, paidAmount: 0, dueDate: '2026-04-10', status: 'Overdue' },
  { id: '3', invoiceNo: 'INV-2026-003', studentName: 'Kabir Singh', className: 'Class 8-B', totalAmount: 25000, paidAmount: 12500, dueDate: '2026-05-15', status: 'Pending' },
];

export const initialStructures: FeeStructure[] = [
  { id: '1', className: 'Nursery - Class 2', tuitionFee: 35000, transportFee: 8000, labFee: 2000, totalAnnual: 45000 },
  { id: '2', className: 'Class 3 - Class 8', tuitionFee: 45000, transportFee: 8000, labFee: 4000, totalAnnual: 57000 },
  { id: '3', className: 'Class 9 - Class 12', tuitionFee: 60000, transportFee: 8000, labFee: 8000, totalAnnual: 76000 },
];

export const initialEmiPlans: EmiPlan[] = [
  { id: '1', studentName: 'Rohan Verma', className: 'Class 7-A', totalInstallments: 4, paidInstallments: 2, nextInstallmentAmount: 12000, nextDueDate: '2026-09-15' },
  { id: '2', studentName: 'Neha Gupta', className: 'Class 10-C', totalInstallments: 4, paidInstallments: 1, nextInstallmentAmount: 15000, nextDueDate: '2026-09-20' },
];

export const initialRefunds: RefundRecord[] = [
  { id: '1', studentName: 'Amitabh Roy', className: 'Class 5', amount: 5000, reason: 'Security Deposit Return', status: 'Pending Approval' },
];

export const initialReceipts: ReceiptRecord[] = [
  { id: '1', receiptNo: 'REC-8821', studentName: 'Aarav Patel', amountPaid: 25000, paymentMode: 'Online UPI', date: '2026-04-08' },
];