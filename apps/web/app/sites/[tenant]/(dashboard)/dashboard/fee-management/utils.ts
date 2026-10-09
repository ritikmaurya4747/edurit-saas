import type { BadgeTone } from "@/components/ui";
import type { Decimal } from "@/lib/api/types";
import type { InvoiceStatus, PaymentMethod } from "./types";
import { PAYMENT_METHODS } from "./types";

// Client-side money maths in integer paise (only for previews; the API
// recomputes everything). "1250.50" → 125050
export const toPaise = (value: Decimal | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export const fromPaise = (paise: number): number => paise / 100;

// Fixed 2-decimal string for inputs/payloads: 125050 → "1250.50"
export const paiseToInput = (paise: number): string => (paise / 100).toFixed(2);

export const FEE_KEYS = [["fees"], ["students"], ["dashboard"]];

export const statusTone = (status: InvoiceStatus, overdue?: boolean): BadgeTone => {
  if (status === "VOID") return "gray";
  if (status === "PAID") return "green";
  if (overdue) return "red";
  return status === "PARTIALLY_PAID" ? "yellow" : "orange";
};

export const statusLabel = (status: InvoiceStatus, overdue?: boolean) => {
  if (overdue && status !== "PAID" && status !== "VOID") return "Overdue";
  return { UNPAID: "Unpaid", PARTIALLY_PAID: "Partially Paid", PAID: "Paid", VOID: "Void" }[status];
};

export const methodLabel = (method: PaymentMethod | string) =>
  PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;

// Fresh idempotency key for one payment attempt.
export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
