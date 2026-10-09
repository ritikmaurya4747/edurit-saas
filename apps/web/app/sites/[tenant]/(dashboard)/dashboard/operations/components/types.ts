import type { BadgeTone, SelectOption } from "@/components/ui";

// Mutations on this page refresh every front-office query and the home stats.
export const OPS_KEYS = [["operations"], ["dashboard"]];

export interface OperationsSummary {
  visitorsInside: number;
  visitorsToday: number;
  infirmaryToday: number;
  lowStockCount: number;
  complianceDueSoon: number;
  complianceOverdue: number;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  checkIn: string;
  checkOut: string | null;
}

export interface InfirmaryVisit {
  id: string;
  studentId: string;
  complaint: string;
  treatment: string;
  visitedAt: string;
  student: {
    id: string;
    name: string;
    admissionNumber: string;
    rollNumber: number | null;
    sectionLabel: string | null;
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  lowStock: boolean;
}

export interface InventoryHistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  user: string | null;
  changes: {
    before?: number;
    after?: number;
    delta?: number;
    reason?: string;
    [key: string]: unknown;
  };
}

export type ComplianceStatus = "PENDING" | "IN_PROGRESS" | "COMPLIANT" | "OVERDUE" | "EXPIRED";

export interface ComplianceRecord {
  id: string;
  title: string;
  complianceType: string;
  documentUrl: string | null;
  dueDate: string;
  status: ComplianceStatus;
  isOverdue: boolean;
  daysUntilDue: number;
}

export const COMPLIANCE_STATUS_OPTIONS: SelectOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "EXPIRED", label: "Expired" },
];

export const COMPLIANCE_STATUS_TONE: Record<ComplianceStatus, BadgeTone> = {
  PENDING: "yellow",
  IN_PROGRESS: "blue",
  COMPLIANT: "green",
  OVERDUE: "red",
  EXPIRED: "orange",
};

export const COMPLIANCE_TYPES = [
  "FIRE_SAFETY",
  "BUILDING",
  "AFFILIATION",
  "TRANSPORT",
  "HEALTH",
  "POLICE_VERIFICATION",
  "OTHER",
];
