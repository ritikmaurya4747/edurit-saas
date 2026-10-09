// API response shapes for the Fees & Billing module (apps/api/src/modules/billing).
// Decimal columns arrive as strings ("1250.00"); report numbers as numbers.
import type { Decimal } from "@/lib/api/types";

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online" },
];

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
];

export interface StudentRef {
  id: string;
  name: string;
  admissionNumber: string;
}

export interface FeeComponent {
  id: string;
  feeStructureId: string;
  name: string;
  amount: Decimal;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYearId: string;
  academicYear: { id: string; name: string; isCurrent: boolean };
  components: FeeComponent[];
  totalAmount: Decimal;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  studentId: string;
  academicYearId: string;
  currency: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  totalAmount: Decimal;
  paidAmount: Decimal;
  balanceAmount: Decimal;
  status: InvoiceStatus;
  version: number;
  dueDate: string;
  createdAt: string;
  student: StudentRef;
  sectionLabel: string | null;
  isOverdue: boolean;
}

export interface InvoiceItem {
  id: string;
  title: string;
  unitAmount: Decimal;
  quantity: number;
  discountAmount: Decimal;
  totalAmount: Decimal;
  feeComponentId: string | null;
}

export interface InvoiceDetail extends Omit<InvoiceListItem, "student" | "sectionLabel"> {
  items: InvoiceItem[];
  academicYear: { id: string; name: string };
  student: StudentRef & { sectionLabel: string | null };
  allocations: {
    id: string;
    allocatedAmount: Decimal;
    allocatedAt: string;
    payment: {
      id: string;
      receiptNumber: string | null;
      method: PaymentMethod;
      paidAt: string;
      amount: Decimal;
      gatewayRef: string | null;
    };
  }[];
  refunds: {
    id: string;
    paymentId: string;
    receiptNumber: string | null;
    reason: string;
    status: string;
    processedAt: string;
    refundAmount: Decimal;
    amount: Decimal;
  }[];
}

export interface PaymentListItem {
  id: string;
  receiptNumber: string | null;
  amount: Decimal;
  paymentMethod: PaymentMethod;
  gatewayRef: string | null;
  remarks: string | null;
  paidAt: string;
  student: StudentRef | null;
  refundedAmount: Decimal;
}

export interface RefundRecord {
  id: string;
  amount: Decimal;
  reason: string;
  status: string;
  processedAt: string;
}

export interface Receipt {
  school: { name: string; displayName: string; logoUrl: string | null };
  currency: string;
  payment: {
    id: string;
    receiptNumber: string | null;
    amount: Decimal;
    paymentMethod: PaymentMethod;
    gatewayRef: string | null;
    remarks: string | null;
    paidAt: string;
  };
  student: (StudentRef & { sectionLabel: string | null }) | null;
  allocations: {
    invoiceId: string;
    invoiceNumber: string;
    dueDate: string;
    invoiceTotal: Decimal;
    allocatedAmount: Decimal;
    balanceAfter: Decimal;
    currentBalance: Decimal;
    currentStatus: InvoiceStatus;
  }[];
  collectedBy: string | null;
  refunds: RefundRecord[];
  refundedAmount: Decimal;
  netAmount: Decimal;
}

export interface RefundListItem extends RefundRecord {
  paymentId: string;
  receiptNumber: string | null;
  payment: { id: string; receiptNumber: string | null; amount: Decimal; method: PaymentMethod; paidAt: string };
  student: StudentRef | null;
}

export interface FeeSummary {
  currency: string;
  academicYearId: string | null;
  invoiced: number;
  collected: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
  todayCollection: number;
  monthCollection: number;
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  monthlyTrend: { month: string; label: string; collected: number }[];
}

export interface Defaulter {
  studentId: string;
  name: string;
  admissionNumber: string;
  sectionLabel: string | null;
  overdueAmount: number;
  overdueInvoices: number;
  oldestDueDate: string;
  daysOverdue: number;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianPhone: string | null;
}

// What the Collect Payment modal is opened with.
export interface CollectTarget {
  student?: StudentRef & { sectionLabel?: string | null };
  invoiceIds?: string[];
}
