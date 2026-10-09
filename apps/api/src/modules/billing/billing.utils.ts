import { ConflictException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@edurit/database';

// ---------------------------------------------------------------------------
// Money. All arithmetic is done on integer paise (1/100 of the currency unit)
// so we never accumulate floating point error. Values are converted back to
// Prisma.Decimal only when written to the database.
// ---------------------------------------------------------------------------
type Numeric = Prisma.Decimal | number | string | null | undefined;

// 1250.5 | "1250.50" | Decimal → 125050
export const toPaise = (value: Numeric): number =>
  value == null ? 0 : new Prisma.Decimal(value).mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();

// 125050 → Decimal("1250.50") for DB writes
export const fromPaise = (paise: number): Prisma.Decimal => new Prisma.Decimal(paise).div(100);

// 125050 → 1250.5 for JSON report numbers (single division, no accumulation)
export const paiseToNumber = (paise: number): number => paise / 100;

// Round(amount * percent / 100) in paise, half-up.
export const percentOf = (paise: number, percent: number): number =>
  new Prisma.Decimal(paise).mul(percent).div(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();

// Split `total` paise into `parts` (floor each, the last part absorbs the remainder).
export const splitEvenly = (total: number, parts: number): number[] => {
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => (i === parts - 1 ? total - base * (parts - 1) : base));
};

export const invoiceStatusFor = (totalPaise: number, paidPaise: number): InvoiceStatus => {
  if (paidPaise >= totalPaise) return InvoiceStatus.PAID;
  if (paidPaise > 0) return InvoiceStatus.PARTIALLY_PAID;
  return InvoiceStatus.UNPAID;
};

// ---------------------------------------------------------------------------
// Dates / timezones
// ---------------------------------------------------------------------------
export const DAY_MS = 86_400_000;

// Offset (ms) between the wall clock in `timeZone` and UTC at `instant`.
const tzOffsetMs = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wallAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

// Real instant at which the calendar day `day` (a UTC-midnight date-only
// value) starts in `timeZone`.
export const zonedDayStart = (day: Date, timeZone: string): Date =>
  new Date(day.getTime() - tzOffsetMs(day, timeZone));

// 'YYYY-MM' of an instant in the school's timezone.
export const zonedMonthKey = (instant: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant).slice(0, 7);

// Add calendar months to a date-only value, clamping to the month's last day
// (31 Jan + 1 month = 28/29 Feb).
export const addMonthsDateOnly = (date: Date, months: number): Date => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
};

// ---------------------------------------------------------------------------
// Document numbers: INV-2026-00001 / RCT-2026-00001, unique per tenant.
// ---------------------------------------------------------------------------
export const documentYear = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric' }).format(new Date());

export const formatDocNumber = (prefix: string, seq: number) => `${prefix}${String(seq).padStart(5, '0')}`;

export const parseDocSeq = (value: string | null | undefined, prefix: string): number => {
  if (!value || !value.startsWith(prefix)) return 0;
  const n = Number(value.slice(prefix.length));
  return Number.isFinite(n) ? n : 0;
};

// Highest invoice sequence used in `prefix` for the tenant (numeric order,
// so INV-2026-100000 sorts after INV-2026-99999).
export async function lastInvoiceSeq(tx: Prisma.TransactionClient, tenantId: string, prefix: string) {
  const rows = await tx.$queryRaw<{ invoice_number: string }[]>`
    SELECT invoice_number FROM student_invoices
    WHERE tenant_id = ${tenantId}::uuid AND invoice_number LIKE ${`${prefix}%`}
    ORDER BY length(invoice_number) DESC, invoice_number DESC
    LIMIT 1`;
  return parseDocSeq(rows[0]?.invoice_number, prefix);
}

export async function lastReceiptSeq(tx: Prisma.TransactionClient, tenantId: string, prefix: string) {
  const rows = await tx.$queryRaw<{ receipt_number: string }[]>`
    SELECT receipt_number FROM fee_payments
    WHERE tenant_id = ${tenantId}::uuid AND receipt_number LIKE ${`${prefix}%`}
    ORDER BY length(receipt_number) DESC, receipt_number DESC
    LIMIT 1`;
  return parseDocSeq(rows[0]?.receipt_number, prefix);
}

// ---------------------------------------------------------------------------
// Concurrency helpers
// ---------------------------------------------------------------------------

// Thrown inside a transaction when an optimistic `version` check fails.
export class VersionConflictError extends Error {
  constructor() {
    super('Invoice version conflict');
  }
}

export const isUniqueViolation = (error: unknown, field?: string): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  if (!field) return true;
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : typeof target === 'string' ? [target] : [];
  return fields.some((f) => f.includes(field));
};

// Runs `fn` (one DB transaction) and retries when a generated document number
// collided with a concurrent request, or an invoice changed underneath us.
export async function withRetry<T>(fn: () => Promise<T>, numberField: 'invoice_number' | 'receipt_number', attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const retryable =
        error instanceof VersionConflictError ||
        isUniqueViolation(error, numberField) ||
        isUniqueViolation(error, numberField === 'invoice_number' ? 'invoiceNumber' : 'receiptNumber');
      if (!retryable || attempt >= attempts) {
        if (error instanceof VersionConflictError) {
          throw new ConflictException('This invoice was updated by someone else at the same time. Please refresh and try again.');
        }
        throw error;
      }
    }
  }
}

// Optimistic update of an invoice's paid/balance figures (version check + bump).
export async function applyInvoicePayment(
  tx: Prisma.TransactionClient,
  invoice: { id: string; version: number; totalAmount: Numeric },
  paidPaise: number,
) {
  const totalPaise = toPaise(invoice.totalAmount);
  const result = await tx.studentInvoice.updateMany({
    where: { id: invoice.id, version: invoice.version },
    data: {
      paidAmount: fromPaise(paidPaise),
      balanceAmount: fromPaise(totalPaise - paidPaise),
      status: invoiceStatusFor(totalPaise, paidPaise),
      version: { increment: 1 },
    },
  });
  if (result.count === 0) throw new VersionConflictError();
}

// Refunds unwind a payment's allocations in reverse allocation order.
// Given allocations (in allocation order) and the paise already refunded,
// returns how much each allocation can still give back.
export const refundableByAllocation = (allocations: { amountPaise: number }[], alreadyRefunded: number): number[] => {
  const remaining = allocations.map((a) => a.amountPaise);
  let left = alreadyRefunded;
  for (let i = remaining.length - 1; i >= 0 && left > 0; i--) {
    const take = Math.min(remaining[i], left);
    remaining[i] -= take;
    left -= take;
  }
  return remaining;
};

// Portion of each refund (in processing order) that hit each allocation.
export const splitRefunds = (allocations: { amountPaise: number }[], refundAmounts: number[]): number[][] => {
  let refunded = 0;
  return refundAmounts.map((amount) => {
    const available = refundableByAllocation(allocations, refunded);
    const portions = allocations.map(() => 0);
    let left = amount;
    for (let i = available.length - 1; i >= 0 && left > 0; i--) {
      const take = Math.min(available[i], left);
      portions[i] = take;
      left -= take;
    }
    refunded += amount;
    return portions;
  });
};

// Search across student first/last name and admission number; every word must match.
export const studentSearchWhere = (search?: string): Prisma.StudentWhereInput | undefined => {
  const words = (search ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (!words.length) return undefined;
  return {
    AND: words.map((w) => ({
      OR: [
        { firstName: { contains: w, mode: 'insensitive' as const } },
        { lastName: { contains: w, mode: 'insensitive' as const } },
        { admissionNumber: { contains: w, mode: 'insensitive' as const } },
      ],
    })),
  };
};

export const studentName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim();
