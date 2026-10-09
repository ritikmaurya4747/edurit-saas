import type { BadgeTone } from "@/components/ui";

// Mutations on this page refresh every transport query and the home stats.
export const TRANSPORT_KEYS = [["transport"], ["dashboard"]];

// Vehicle documents expiring within this many days are highlighted (matches the API).
export const EXPIRY_WARNING_DAYS = 30;

export interface ExpiringDocument {
  vehicleId: string;
  registrationNumber: string;
  document: "INSURANCE" | "FITNESS";
  expiryDate: string;
  daysLeft: number;
  expired: boolean;
}

export interface TransportSummary {
  vehicles: number;
  routes: number;
  studentsUsingTransport: number;
  capacity: number;
  occupancyPercent: number;
  expiringDocuments: ExpiringDocument[];
  expiredDocuments: number;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string | null;
  capacity: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string | null;
  helperName: string | null;
  helperPhone: string | null;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  isActive: boolean;
  routes: { id: string; name: string; code: string; isActive: boolean; activeStudents: number }[];
  routeNames: string[];
  assignedStudents: number;
  insuranceExpiresInDays: number | null;
  fitnessExpiresInDays: number | null;
}

export interface RouteStop {
  id: string;
  name: string;
  sequence: number;
  pickupTime: string | null;
  dropTime: string | null;
  fee: string | null;
  studentCount: number;
}

export interface RouteVehicle {
  id: string;
  registrationNumber: string;
  model: string | null;
  capacity: number;
  driverName: string;
  driverPhone: string;
  helperName: string | null;
  helperPhone: string | null;
  isActive: boolean;
}

export interface TransportRoute {
  id: string;
  name: string;
  code: string;
  vehicleId: string | null;
  monthlyFee: string;
  isActive: boolean;
  vehicle: RouteVehicle | null;
  stops: RouteStop[];
  activeStudents: number;
  occupancy: { used: number; capacity: number | null; available: number | null; percent: number | null };
}

export interface TransportStudent {
  id: string;
  name: string;
  admissionNumber: string;
  rollNumber: number | null;
  sectionId: string | null;
  sectionLabel: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianPhone: string | null;
}

export interface RouteDetail extends TransportRoute {
  assignments: {
    id: string;
    startDate: string;
    stop: { id: string; name: string; sequence: number; pickupTime: string | null; dropTime: string | null; fee: string | null } | null;
    student: TransportStudent;
  }[];
}

export interface Assignment {
  id: string;
  studentId: string;
  routeId: string;
  stopId: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  student: TransportStudent;
  route: {
    id: string;
    name: string;
    code: string;
    monthlyFee: string;
    isActive: boolean;
    isDeleted: boolean;
    vehicle: { id: string; registrationNumber: string; driverName: string; driverPhone: string } | null;
  };
  stop: { id: string; name: string; sequence: number; pickupTime: string | null; dropTime: string | null; fee: string | null } | null;
  monthlyFee: number;
}

// Badge for an insurance / fitness expiry date.
export function expiryTone(days: number | null): BadgeTone {
  if (days === null) return "gray";
  if (days < 0) return "red";
  if (days <= EXPIRY_WARNING_DAYS) return "orange";
  return "green";
}

export function expiryHint(days: number | null): string {
  if (days === null) return "Not recorded";
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

// "07:10" → "7:10 AM"
export function formatClock(value: string | null | undefined): string {
  if (!value) return "—";
  const [h = NaN, m = NaN] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
