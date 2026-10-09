import type { QueryKey } from "@tanstack/react-query";
import type { IssuedCredential } from "@/components/credentials/CredentialsSheet";

// Shared Excel/CSV import wizard (students & staff). Everything here is
// generic; the per-entity pages pass an ImportConfig.

export interface ImportColumn {
  // Field name in the API row DTO.
  key: string;
  // Header text in the template (a "*" is appended for required columns).
  header: string;
  required?: boolean;
  width?: number;
  example?: string;
  // Other header spellings accepted on upload ("DOB", "Adm No"...).
  aliases?: string[];
  // Shown on the Instructions sheet and the template step.
  note?: string;
  // Dropdown values in the Excel template.
  list?: string[];
  // Excel date cells in this column become YYYY-MM-DD.
  date?: boolean;
  // Keep as text in the template (mobile numbers, codes) so Excel does not
  // turn them into numbers / scientific notation.
  text?: boolean;
}

// One data row of the uploaded file: cell text by column key.
export interface ParsedRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ParsedFile {
  fileName: string;
  rows: ParsedRow[];
  ignoredHeaders: string[];
  skippedExampleRow: boolean;
}

export type RowStatus = "ok" | "warning" | "error";

export interface RowResult {
  rowNumber: number;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  normalized: Record<string, unknown> | null;
}

export interface ValidateResponse {
  rows: RowResult[];
  summary: { total: number; ok: number; warning: number; error: number };
}

export interface SkippedLogin {
  name: string;
  role: string;
  reason: string;
}

export interface CommitResponse {
  created: ({ rowNumber: number; name: string } & Record<string, unknown>)[];
  failed: { rowNumber: number; errors: string[] }[];
  warnings?: { rowNumber: number; warnings: string[] }[];
  credentials: IssuedCredential[];
  skippedLogins: SkippedLogin[];
  classesCreated?: string[];
}

export interface ImportOption {
  key: string;
  label: string;
  hint?: string;
  defaultValue: boolean;
  // Changing it changes the validation result (e.g. create missing classes).
  revalidate?: boolean;
}

// Duplicate checks across validation chunks (the API checks inside a chunk).
export interface CrossCheck {
  level: "error" | "warning";
  key: (normalized: Record<string, unknown>) => string | null;
  message: (normalized: Record<string, unknown>, firstRow: number) => string;
}

export interface ImportConfig {
  // "student" / "students"
  entity: string;
  entityPlural: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  doneHref: string;
  // POST <apiBase>/validate and <apiBase>/commit
  apiBase: string;
  templateFileName: string;
  sheetName: string;
  columns: ImportColumn[];
  instructions: string[];
  // Values compared to detect the template's example row left in the file.
  exampleKeys: string[];
  // Dropdown lists still loading (template download waits).
  templateLoading?: boolean;
  options: ImportOption[];
  // Options sent with validate / commit. `groupCounts` = importable rows per
  // normalized.sectionKey (earlier chunks for validate, whole file for commit).
  validateOptions: (
    options: Record<string, boolean>,
    ctx: { precedingRows: number; groupCounts: Record<string, number> },
  ) => Record<string, unknown>;
  commitOptions: (options: Record<string, boolean>, ctx: { groupCounts: Record<string, number> }) => Record<string, unknown>;
  // normalized field used to count rows per group (e.g. "sectionKey").
  groupKey?: string;
  crossChecks: CrossCheck[];
  // Rows sent to commit in this order (stable).
  commitPriority?: (row: ParsedRow) => number;
  invalidate: QueryKey[];
  credentialsTitle: string;
  // Describes a created record in the results list.
  createdLabel: (created: CommitResponse["created"][number]) => string;
}
