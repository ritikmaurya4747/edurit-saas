import { HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import type { AuthUser } from '../../common/types/auth-user';

export type RowStatus = 'ok' | 'warning' | 'error';

// Validation result of one spreadsheet row.
export interface RowResult<N> {
  rowNumber: number;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  // Cleaned values (null when the row has errors that prevent normalising).
  normalized: N | null;
}

export interface SkippedLogin {
  name: string;
  role: string;
  reason: string;
}

// Mutable per-row collector used while checking a row.
export class RowCheck {
  readonly errors: string[] = [];
  readonly warnings: string[] = [];

  constructor(readonly rowNumber: number) {}

  error(message: string) {
    if (!this.errors.includes(message)) this.errors.push(message);
  }

  warn(message: string) {
    if (!this.warnings.includes(message)) this.warnings.push(message);
  }

  get ok() {
    return this.errors.length === 0;
  }

  result<N>(normalized: N | null): RowResult<N> {
    return {
      rowNumber: this.rowNumber,
      status: this.errors.length ? 'error' : this.warnings.length ? 'warning' : 'ok',
      errors: this.errors,
      warnings: this.warnings,
      normalized,
    };
  }
}

export const hasPermission = (user: AuthUser, code: string) => user.isAdmin || user.permissions.includes(code);

const logger = new Logger('Imports');

// Human message for an error thrown while importing one row.
export function rowErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'object' && response && 'message' in response) {
      const message = (response as { message: unknown }).message;
      if (Array.isArray(message)) return message.join('; ');
      if (typeof message === 'string') return message;
    }
    return error.message;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = JSON.stringify(error.meta?.target ?? '').replace(/[\[\]"]/g, '').replace(/_/g, ' ');
      return `A record with the same ${target || 'value'} already exists`;
    }
    if (error.code === 'P2028' || error.code === 'P2024') return 'The server was busy; this row was not imported. Import it again.';
  }
  logger.error(`Import row failed: ${(error as Error)?.message ?? error}`, (error as Error)?.stack);
  return 'Unexpected error while importing this row. Try importing it again.';
}

export function summarize(rows: { status: string }[]) {
  return {
    total: rows.length,
    ok: rows.filter((r) => r.status === 'ok').length,
    warning: rows.filter((r) => r.status === 'warning').length,
    error: rows.filter((r) => r.status === 'error').length,
  };
}
