"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  ListChecks,
  RotateCcw,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import CredentialsSheet, { type IssuedCredential } from "@/components/credentials/CredentialsSheet";
import { Button, Card, Checkbox, ConfirmDialog, ErrorState, PageHeader, StatTile } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { Dropzone, ProgressBar, StatusPill, Stepper, SummaryChip } from "./parts";
import {
  columnHeader,
  downloadErrorReport,
  downloadTemplateCsv,
  downloadTemplateXlsx,
  ImportFileError,
  MAX_IMPORT_ROWS,
  readImportFile,
} from "./spreadsheet";
import type { CommitResponse, ImportConfig, ParsedFile, ParsedRow, RowResult, SkippedLogin, ValidateResponse } from "./types";

// Rows per validate request (the API accepts up to 500).
const VALIDATE_CHUNK = 200;
// Rows per commit request. Each row is admitted in its own transaction with
// bcrypt-hashed logins, so a chunk takes a few seconds per row: small chunks
// keep every request far below proxy timeouts and give a smooth progress bar.
const COMMIT_CHUNK = 25;
const PAGE_SIZE = 50;

type Filter = "all" | "ok" | "warning" | "error";

interface Outcome {
  created: CommitResponse["created"];
  failed: { rowNumber: number; errors: string[] }[];
  warnings: { rowNumber: number; warnings: string[] }[];
  credentials: IssuedCredential[];
  skipped: SkippedLogin[];
  classesCreated: string[];
  // Set when a request failed and the import stopped.
  aborted: { message: string; rowNumbers: number[] } | null;
  finished: boolean;
}

const emptyOutcome = (): Outcome => ({
  created: [],
  failed: [],
  warnings: [],
  credentials: [],
  skipped: [],
  classesCreated: [],
  aborted: null,
  finished: false,
});

const statusOf = (r: { errors: string[]; warnings: string[] }): RowResult["status"] =>
  r.errors.length ? "error" : r.warnings.length ? "warning" : "ok";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

export default function ImportWizard({ config }: { config: ImportConfig }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);

  const [results, setResults] = useState<RowResult[] | null>(null);
  const [validating, setValidating] = useState<{ done: number; total: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.options.map((o) => [o.key, o.defaultValue])),
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const [importing, setImporting] = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const busy = !!validating || !!importing;

  // Leaving mid-way would lose progress (and one-time passwords).
  useEffect(() => {
    const hasUnseenCredentials = !!outcome?.credentials.length;
    if (!busy && !hasUnseenCredentials) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy, outcome?.credentials.length]);

  const rowsByNumber = useMemo(() => new Map(file?.rows.map((r) => [r.rowNumber, r]) ?? []), [file]);

  // ------------------------------------------------------------------ template
  const downloadTemplate = async (format: "xlsx" | "csv") => {
    if (format === "csv") {
      downloadTemplateCsv(config.templateFileName, config.columns);
      return;
    }
    setTemplateBusy(true);
    try {
      await downloadTemplateXlsx({
        fileName: config.templateFileName,
        sheetName: config.sheetName,
        columns: config.columns,
        instructions: config.instructions,
        title: config.title,
      });
    } catch (error) {
      toast.error(`Could not create the Excel template: ${errorMessage(error)}. Use the CSV template instead.`);
    } finally {
      setTemplateBusy(false);
    }
  };

  // ---------------------------------------------------------------- validation
  const toApiRow = useCallback(
    (row: ParsedRow) => {
      const out: Record<string, unknown> = { rowNumber: row.rowNumber };
      for (const c of config.columns) {
        const v = row.values[c.key];
        if (v) out[c.key] = v.slice(0, c.key === "address" ? 2000 : 500);
      }
      return out;
    },
    [config.columns],
  );

  const runValidation = useCallback(
    async (parsed: ParsedFile, opts: Record<string, boolean>) => {
      setValidationError(null);
      setValidating({ done: 0, total: parsed.rows.length });
      const all: (RowResult & { chunk: number })[] = [];
      const groupCounts: Record<string, number> = {};
      let precedingRows = 0;
      try {
        for (let i = 0, chunk = 0; i < parsed.rows.length; i += VALIDATE_CHUNK, chunk++) {
          const slice = parsed.rows.slice(i, i + VALIDATE_CHUNK);
          const res = await api.post<ValidateResponse>(`${config.apiBase}/validate`, {
            rows: slice.map(toApiRow),
            options: config.validateOptions(opts, { precedingRows, groupCounts: { ...groupCounts } }),
          });
          const byRow = new Map(res.rows.map((r) => [r.rowNumber, r]));
          for (const row of slice) {
            const r = byRow.get(row.rowNumber) ?? {
              rowNumber: row.rowNumber,
              status: "error" as const,
              errors: ["This row was not checked. Validate again."],
              warnings: [],
              normalized: null,
            };
            all.push({ ...r, errors: [...r.errors], warnings: [...r.warnings], chunk });
            if (r.status !== "error") {
              precedingRows++;
              const key = config.groupKey ? r.normalized?.[config.groupKey] : null;
              if (typeof key === "string") groupCounts[key] = (groupCounts[key] ?? 0) + 1;
            }
          }
          setValidating({ done: Math.min(i + slice.length, parsed.rows.length), total: parsed.rows.length });
        }

        // Duplicates across chunks (each chunk is checked by the API on its own).
        for (const check of config.crossChecks) {
          const first = new Map<string, { rowNumber: number; chunk: number }>();
          for (const r of all) {
            if (!r.normalized || r.status === "error") continue;
            const key = check.key(r.normalized);
            if (!key) continue;
            const prev = first.get(key);
            if (!prev) first.set(key, { rowNumber: r.rowNumber, chunk: r.chunk });
            else if (prev.chunk !== r.chunk) {
              (check.level === "error" ? r.errors : r.warnings).push(check.message(r.normalized, prev.rowNumber));
            }
          }
        }
        setResults(all.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors, warnings: r.warnings, normalized: r.normalized, status: statusOf(r) })));
        setFilter("all");
        setPage(1);
        setStep(3);
      } catch (error) {
        setValidationError(errorMessage(error));
      } finally {
        setValidating(null);
      }
    },
    [config, toApiRow],
  );

  const onFile = async (f: File) => {
    setFileError(null);
    setValidationError(null);
    setResults(null);
    setReading(true);
    try {
      const parsed = await readImportFile(f, config.columns, config.exampleKeys);
      setFile(parsed);
      setReading(false);
      await runValidation(parsed, options);
    } catch (error) {
      setFile(null);
      setFileError(
        error instanceof ImportFileError ? error.message : `The file could not be read: ${errorMessage(error)}`,
      );
    } finally {
      setReading(false);
    }
  };

  const changeOption = (key: string, value: boolean) => {
    const next = { ...options, [key]: value };
    setOptions(next);
    if (file && config.options.find((o) => o.key === key)?.revalidate) void runValidation(file, next);
  };

  // ------------------------------------------------------------------- review
  const counts = useMemo(() => {
    const c = { ok: 0, warning: 0, error: 0 };
    results?.forEach((r) => c[r.status]++);
    return c;
  }, [results]);
  const importableCount = counts.ok + counts.warning;
  const filtered = useMemo(
    () => (results ?? []).filter((r) => filter === "all" || r.status === filter),
    [results, filter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const downloadReport = async (
    rows: { rowNumber: number; errors: string[]; warnings: string[] }[],
    format: "xlsx" | "csv",
    suffix: string,
  ) => {
    const data = rows
      .map((r) => ({ row: rowsByNumber.get(r.rowNumber), errors: r.errors, warnings: r.warnings }))
      .filter((r): r is { row: ParsedRow; errors: string[]; warnings: string[] } => !!r.row)
      .sort((a, b) => a.row.rowNumber - b.row.rowNumber);
    if (!data.length) return;
    try {
      await downloadErrorReport({
        fileName: `${config.templateFileName.replace(/-template$/, "")}-${suffix}-${new Date().toISOString().slice(0, 10)}`,
        sheetName: config.sheetName,
        columns: config.columns,
        rows: data,
        format,
      });
    } catch (error) {
      toast.error(`Could not create the report: ${errorMessage(error)}`);
    }
  };

  // ------------------------------------------------------------------- import
  const runImport = async () => {
    if (!file || !results) return;
    setConfirmSkip(false);
    const okRows = new Set(results.filter((r) => r.status !== "error").map((r) => r.rowNumber));
    const rows = file.rows.filter((r) => okRows.has(r.rowNumber));
    if (config.commitPriority) {
      const priority = config.commitPriority;
      rows.sort((a, b) => priority(a) - priority(b) || a.rowNumber - b.rowNumber);
    }
    const groupCounts: Record<string, number> = {};
    if (config.groupKey) {
      for (const r of results) {
        const key = r.status !== "error" ? r.normalized?.[config.groupKey] : null;
        if (typeof key === "string") groupCounts[key] = (groupCounts[key] ?? 0) + 1;
      }
    }

    const acc = emptyOutcome();
    const credentials = new Map<string, IssuedCredential>();
    setStep(4);
    setOutcome({ ...acc });
    setImporting({ done: 0, total: rows.length });

    for (let i = 0; i < rows.length; i += COMMIT_CHUNK) {
      const slice = rows.slice(i, i + COMMIT_CHUNK);
      try {
        const res = await api.post<CommitResponse>(`${config.apiBase}/commit`, {
          rows: slice.map(toApiRow),
          options: config.commitOptions(options, { groupCounts }),
        });
        acc.created.push(...res.created);
        acc.failed.push(...res.failed);
        acc.warnings.push(...(res.warnings ?? []));
        acc.skipped.push(...res.skippedLogins);
        acc.classesCreated.push(...(res.classesCreated ?? []));
        // Same login issued twice → the later password is the valid one.
        res.credentials.forEach((c) => credentials.set(c.userId ?? `${c.role}:${c.loginId}`, c));
        acc.credentials = [...credentials.values()];
      } catch (error) {
        acc.aborted = {
          message: errorMessage(error),
          rowNumbers: rows.slice(i).map((r) => r.rowNumber),
        };
        break;
      } finally {
        setOutcome({ ...acc });
      }
      setImporting({ done: Math.min(i + slice.length, rows.length), total: rows.length });
    }

    acc.finished = true;
    setOutcome({ ...acc });
    setImporting(null);
    await Promise.all(config.invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    if (acc.created.length) toast.success(`${acc.created.length} ${acc.created.length === 1 ? config.entity : config.entityPlural} imported`);
    if (acc.credentials.length) setSheetOpen(true);
  };

  const startImport = () => {
    if (counts.error > 0) setConfirmSkip(true);
    else void runImport();
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setOutcome(null);
    setFileError(null);
    setValidationError(null);
    setSheetOpen(false);
    setStep(2);
  };

  // Rows that still need attention after the import: review errors + failures.
  const rowsToFix = useMemo(() => {
    if (!outcome || !results) return [];
    const list: { rowNumber: number; errors: string[]; warnings: string[] }[] = results
      .filter((r) => r.status === "error")
      .map((r) => ({ rowNumber: r.rowNumber, errors: r.errors, warnings: r.warnings }));
    outcome.failed.forEach((f) => list.push({ rowNumber: f.rowNumber, errors: f.errors, warnings: [] }));
    outcome.aborted?.rowNumbers.forEach((n) =>
      list.push({
        rowNumber: n,
        errors: [
          `Not imported: the import stopped (${outcome.aborted?.message}). Check the ${config.entityPlural} list before importing this row again.`,
        ],
        warnings: [],
      }),
    );
    return list;
  }, [outcome, results, config.entityPlural]);

  const nameOf = (rowNumber: number) => {
    const v = rowsByNumber.get(rowNumber)?.values;
    return v ? [v.firstName, v.lastName].filter(Boolean).join(" ") || "—" : "—";
  };

  // ------------------------------------------------------------------- render
  return (
    <div>
      <Link
        href={config.backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {config.backLabel}
      </Link>
      <PageHeader title={config.title} description={config.description} />

      <Stepper step={step} onStep={busy || step === 4 ? undefined : (n) => setStep(n)} />

      {/* ------------------------------------------------ 1. template */}
      {step === 1 && (
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">1. Download the template</h2>
              <p className="text-xs text-gray-500">Fill one {config.entity} per row, keep the header row unchanged.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => downloadTemplate("xlsx")} loading={templateBusy} disabled={config.templateLoading}>
                <FileSpreadsheet className="h-4 w-4" /> Excel template
              </Button>
              <Button variant="secondary" onClick={() => downloadTemplate("csv")}>
                <Download className="h-4 w-4" /> CSV template
              </Button>
            </div>
          </div>

          <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {config.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-bold">Column</th>
                  <th className="px-3 py-2 font-bold">Required</th>
                  <th className="px-3 py-2 font-bold">What to enter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {config.columns.map((c) => (
                  <tr key={c.key}>
                    <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-900">{c.header}</td>
                    <td className="px-3 py-2">{c.required ? <span className="font-bold text-red-600">Yes</span> : "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{c.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={() => setStep(2)}>I have my file — next</Button>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ 2. upload */}
      {step === 2 && (
        <Card className="p-5">
          <h2 className="mb-1 text-base font-bold text-gray-900">2. Upload your file</h2>
          <p className="mb-4 text-xs text-gray-500">
            The file is read in your browser and checked against your school&apos;s data. Nothing is saved until you confirm the
            import.
          </p>
          <Dropzone onFile={onFile} disabled={reading || !!validating} fileName={file?.fileName} />

          {reading && <p className="mt-4 text-sm font-semibold text-gray-600">Reading file…</p>}
          {fileError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {file && (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-800">
                <FileSpreadsheet className="mr-1 inline h-4 w-4 text-green-700" />
                {file.fileName} · {file.rows.length.toLocaleString()} row(s)
              </p>
              {file.skippedExampleRow && (
                <p className="text-xs text-gray-500">The example row from the template was skipped.</p>
              )}
              {file.ignoredHeaders.length > 0 && (
                <p className="text-xs text-amber-700">Ignored column(s) not in the template: {file.ignoredHeaders.join(", ")}</p>
              )}
            </div>
          )}

          {validating && (
            <div className="mt-5">
              <ProgressBar
                done={validating.done}
                total={validating.total}
                label={`Checking rows… ${validating.done.toLocaleString()} of ${validating.total.toLocaleString()}`}
              />
            </div>
          )}
          {validationError && (
            <div className="mt-5">
              <ErrorState
                message={`Validation failed: ${validationError}`}
                onRetry={file ? () => void runValidation(file, options) : undefined}
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>
              Back to template
            </Button>
            {file && results && !validating && (
              <Button onClick={() => setStep(3)}>
                <ListChecks className="h-4 w-4" /> Review results
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ 3. review */}
      {step === 3 && file && results && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-base font-bold text-gray-900">3. Review</h2>
              <p className="text-xs text-gray-500">
                {file.fileName} · {results.length.toLocaleString()} row(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SummaryChip
                tone="gray"
                icon={<ListChecks className="h-4 w-4" />}
                label="All"
                count={results.length}
                active={filter === "all"}
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
              />
              <SummaryChip
                tone="green"
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Ready"
                count={counts.ok}
                active={filter === "ok"}
                onClick={() => {
                  setFilter("ok");
                  setPage(1);
                }}
              />
              <SummaryChip
                tone="amber"
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Warnings"
                count={counts.warning}
                active={filter === "warning"}
                onClick={() => {
                  setFilter("warning");
                  setPage(1);
                }}
              />
              <SummaryChip
                tone="red"
                icon={<XCircle className="h-4 w-4" />}
                label="Errors"
                count={counts.error}
                active={filter === "error"}
                onClick={() => {
                  setFilter("error");
                  setPage(1);
                }}
              />
            </div>
            {counts.error > 0 && (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-800 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {counts.error} row(s) have errors and will be skipped. Download them, fix the file and upload those rows again.
                </span>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadReport(results.filter((r) => r.status === "error"), "xlsx", "errors")}
                  >
                    <Download className="h-3.5 w-3.5" /> Error report (.xlsx)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadReport(results.filter((r) => r.status === "error"), "csv", "errors")}
                  >
                    CSV
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            {validating && (
              <div className="border-b border-gray-100 p-4">
                <ProgressBar done={validating.done} total={validating.total} label="Re-checking rows…" />
              </div>
            )}
            {validationError && (
              <div className="border-b border-gray-100 p-4">
                <ErrorState message={`Validation failed: ${validationError}`} onRetry={() => void runValidation(file, options)} />
              </div>
            )}
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs">
                <thead>
                  <tr>
                    {["Row", "Status", "Issues", ...config.columns.map(columnHeader)].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-3 py-2 font-bold whitespace-nowrap text-gray-600",
                          i === 2 && "min-w-[280px]",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const row = rowsByNumber.get(r.rowNumber);
                    return (
                      <tr
                        key={r.rowNumber}
                        className={cn(
                          r.status === "error" && "bg-red-50/40",
                          r.status === "warning" && "bg-amber-50/30",
                        )}
                      >
                        <td className="border-b border-gray-100 px-3 py-2 align-top font-bold text-gray-500">{r.rowNumber}</td>
                        <td className="border-b border-gray-100 px-3 py-2 align-top">
                          <StatusPill status={r.status} />
                        </td>
                        <td className="max-w-[420px] border-b border-gray-100 px-3 py-2 align-top whitespace-normal">
                          {r.errors.map((e) => (
                            <p key={e} className="font-semibold text-red-700">
                              • {e}
                            </p>
                          ))}
                          {r.warnings.map((w) => (
                            <p key={w} className="text-amber-700">
                              • {w}
                            </p>
                          ))}
                          {!r.errors.length && !r.warnings.length && <span className="text-gray-400">—</span>}
                        </td>
                        {config.columns.map((c) => (
                          <td
                            key={c.key}
                            className="max-w-[220px] truncate border-b border-gray-100 px-3 py-2 align-top font-semibold text-gray-800"
                            title={row?.values[c.key] ?? ""}
                          >
                            {row?.values[c.key] || <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {!visible.length && (
                    <tr>
                      <td colSpan={config.columns.length + 3} className="px-3 py-10 text-center text-sm text-gray-500">
                        No rows in this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                <span>
                  Rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            {config.options.length > 0 && (
              <div className="mb-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Options</h3>
                {config.options.map((o) => (
                  <div key={o.key}>
                    <Checkbox
                      label={<span className="font-semibold">{o.label}</span>}
                      checked={!!options[o.key]}
                      onChange={(v) => changeOption(o.key, v)}
                      disabled={busy}
                    />
                    {o.hint && <p className="ml-6 text-xs text-gray-500">{o.hint}</p>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                <RotateCcw className="h-4 w-4" /> Upload a different file
              </Button>
              <Button onClick={startImport} disabled={busy || importableCount === 0}>
                Import {importableCount.toLocaleString()} {importableCount === 1 ? config.entity : config.entityPlural}
              </Button>
            </div>
            {importableCount === 0 && (
              <p className="mt-2 text-right text-xs text-red-600">Every row has errors. Fix the file and upload it again.</p>
            )}
          </Card>
        </div>
      )}

      {/* ------------------------------------------------ 4. import / results */}
      {step === 4 && outcome && (
        <div className="space-y-4">
          {importing && (
            <Card className="p-5">
              <ProgressBar
                done={importing.done}
                total={importing.total}
                label={`Importing… ${importing.done.toLocaleString()} of ${importing.total.toLocaleString()} rows`}
              />
              <p className="mt-3 text-xs text-gray-500">
                Keep this tab open until the import finishes. {outcome.created.length.toLocaleString()} imported so far.
              </p>
            </Card>
          )}

          {outcome.finished && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Imported" value={outcome.created.length.toLocaleString()} tone="success" />
                <StatTile
                  label="Not imported"
                  value={rowsToFix.length.toLocaleString()}
                  tone={rowsToFix.length ? "danger" : "default"}
                  hint={rowsToFix.length ? "Download, fix and re-upload" : undefined}
                />
                <StatTile label="Logins issued" value={outcome.credentials.length.toLocaleString()} />
                <StatTile label="Logins skipped" value={outcome.skipped.length.toLocaleString()} />
              </div>

              {outcome.aborted && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    The import stopped: {outcome.aborted.message}. {outcome.aborted.rowNumbers.length} row(s) were not processed. Check the{" "}
                    {config.entityPlural} list first (the last batch may be partly saved), then upload the remaining rows again.
                  </span>
                </div>
              )}

              {outcome.credentials.length > 0 && (
                <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2 text-sm text-amber-900">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <b>{outcome.credentials.length} login(s) issued.</b> Temporary passwords are shown only once — print the slips or
                      download the CSV before leaving this page.
                    </span>
                  </div>
                  <Button onClick={() => setSheetOpen(true)}>
                    <KeyRound className="h-4 w-4" /> View credentials
                  </Button>
                </Card>
              )}

              {outcome.classesCreated.length > 0 && (
                <Card className="p-4 text-sm text-gray-700">
                  <b>Created during import:</b> {outcome.classesCreated.join(", ")}
                </Card>
              )}

              {rowsToFix.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="flex flex-col gap-2 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Rows not imported ({rowsToFix.length})</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => downloadReport(rowsToFix, "xlsx", "not-imported")}>
                        <Download className="h-3.5 w-3.5" /> Download (.xlsx)
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadReport(rowsToFix, "csv", "not-imported")}>
                        CSV
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[40vh] overflow-auto">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead className="sticky top-0 bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-bold">Row</th>
                          <th className="px-3 py-2 font-bold">Name</th>
                          <th className="px-3 py-2 font-bold">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rowsToFix.map((r) => (
                          <tr key={r.rowNumber}>
                            <td className="px-3 py-2 align-top font-bold text-gray-500">{r.rowNumber}</td>
                            <td className="px-3 py-2 align-top font-semibold whitespace-nowrap text-gray-800">{nameOf(r.rowNumber)}</td>
                            <td className="px-3 py-2 align-top text-red-700">{r.errors.join(" • ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {outcome.warnings.length > 0 && (
                <Card className="p-4">
                  <h3 className="mb-2 text-sm font-bold text-gray-900">Imported with notes</h3>
                  <ul className="space-y-1 text-xs text-amber-800">
                    {outcome.warnings.map((w) => (
                      <li key={w.rowNumber}>
                        <b>Row {w.rowNumber}</b> ({nameOf(w.rowNumber)}): {w.warnings.join(" • ")}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {outcome.created.length > 0 && (
                <Card className="p-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-gray-900">
                      Imported {config.entityPlural} ({outcome.created.length})
                    </summary>
                    <ul className="mt-2 max-h-[40vh] space-y-1 overflow-auto text-xs text-gray-700">
                      {[...outcome.created]
                        .sort((a, b) => a.rowNumber - b.rowNumber)
                        .map((c) => (
                          <li key={c.rowNumber}>
                            <span className="font-bold text-gray-500">Row {c.rowNumber}</span> · {config.createdLabel(c)}
                          </li>
                        ))}
                    </ul>
                  </details>
                </Card>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Import another file
                </Button>
                <Button onClick={() => router.push(config.doneHref)}>Go to {config.entityPlural}</Button>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmSkip}
        onClose={() => setConfirmSkip(false)}
        onConfirm={() => void runImport()}
        tone="primary"
        title={`Import ${importableCount} ${importableCount === 1 ? config.entity : config.entityPlural}?`}
        confirmLabel="Skip errors and import"
        message={
          <>
            <p>
              {counts.error} row(s) with errors will be <b>skipped</b>. You can download them from the results page, fix them and
              upload them again later.
            </p>
            <p className="mt-2 text-xs text-gray-500">Up to {MAX_IMPORT_ROWS.toLocaleString()} rows can be imported per file.</p>
          </>
        }
      />

      <CredentialsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={config.credentialsTitle}
        credentials={outcome?.credentials ?? []}
        skipped={outcome?.skipped ?? []}
      />
    </div>
  );
}
