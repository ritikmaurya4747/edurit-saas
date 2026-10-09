import type { CellValue, Workbook, Worksheet } from "exceljs";
import type { ImportColumn, ParsedFile, ParsedRow } from "./types";

// Browser-side Excel / CSV helpers. exceljs is large, so it is loaded only
// when a template is downloaded or an .xlsx file is read.

export const MAX_IMPORT_ROWS = 2000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Rows that get dropdowns in the template.
const TEMPLATE_ROWS = MAX_IMPORT_ROWS + 1;

export class ImportFileError extends Error {}

async function loadExcel() {
  const mod = await import("exceljs");
  return (mod.default ?? mod) as typeof import("exceljs");
}

// "Father's Name *" → "fathersname"
const headerKey = (value: string) => value.toLowerCase().replace(/\*/g, "").replace(/[^a-z0-9]+/g, "");

export const columnHeader = (c: ImportColumn) => (c.required ? `${c.header}*` : c.header);

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// Text of one exceljs cell value (rich text, hyperlinks, formulas, dates).
function cellText(value: CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : isoDate(value);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
    if ("formula" in value || "sharedFormula" in value) return cellText((value as { result?: CellValue }).result);
    if ("hyperlink" in value) {
      const text = (value as { text?: unknown }).text;
      if (typeof text === "string") return text;
      if (text && typeof text === "object") return cellText(text as CellValue);
      return String((value as { hyperlink: string }).hyperlink).replace(/^mailto:/i, "");
    }
    if ("error" in value) return "";
  }
  return String(value);
}

// Extra columns of our own error report: silently ignored on re-upload.
const REPORT_HEADERS = ["errors", "warnings", "originalrow"];

// Maps file headers to column keys. Returns key per file column index.
function mapHeaders(headers: string[], columns: ImportColumn[]) {
  const lookup = new Map<string, string>();
  for (const c of columns) {
    lookup.set(headerKey(c.header), c.key);
    lookup.set(headerKey(c.key), c.key);
    c.aliases?.forEach((a) => lookup.set(headerKey(a), c.key));
  }
  const keys: (string | null)[] = [];
  const ignored: string[] = [];
  const seen = new Set<string>();
  headers.forEach((h) => {
    const key = lookup.get(headerKey(h)) ?? null;
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    } else {
      keys.push(null);
      if (h.trim() && !REPORT_HEADERS.includes(headerKey(h))) ignored.push(h.trim());
    }
  });
  return { keys, ignored, matched: seen };
}

function finish(
  fileName: string,
  table: { rowNumber: number; cells: string[] }[],
  columns: ImportColumn[],
  exampleKeys: string[],
): ParsedFile {
  // Header = the first of the top 10 rows that matches the most columns
  // (some schools add a title row above the headers).
  let headerIndex = -1;
  let best = 0;
  table.slice(0, 10).forEach((row, i) => {
    const { matched } = mapHeaders(row.cells, columns);
    if (matched.size > best) {
      best = matched.size;
      headerIndex = i;
    }
  });
  if (headerIndex < 0 || best < 2) {
    throw new ImportFileError("Could not find the header row. Use the template and keep its first row (column names) unchanged.");
  }

  const { keys, ignored, matched } = mapHeaders(table[headerIndex]?.cells ?? [], columns);
  const missing = columns.filter((c) => c.required && !matched.has(c.key)).map((c) => c.header);
  if (missing.length) {
    throw new ImportFileError(`Required column(s) missing: ${missing.join(", ")}. Download the template to see the expected columns.`);
  }

  const example = columns.filter((c) => exampleKeys.includes(c.key));
  let skippedExampleRow = false;
  const rows: ParsedRow[] = [];
  for (const row of table.slice(headerIndex + 1)) {
    const values: Record<string, string> = {};
    let hasValue = false;
    keys.forEach((key, i) => {
      if (!key) return;
      const v = (row.cells[i] ?? "").replace(/\u00a0/g, " ").trim();
      values[key] = v;
      if (v) hasValue = true;
    });
    if (!hasValue) continue;
    if (example.length && example.every((c) => (values[c.key] ?? "") === (c.example ?? ""))) {
      skippedExampleRow = true;
      continue;
    }
    rows.push({ rowNumber: row.rowNumber, values });
  }

  if (!rows.length) throw new ImportFileError("The file has no data rows below the header.");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(
      `The file has ${rows.length.toLocaleString()} rows; import at most ${MAX_IMPORT_ROWS.toLocaleString()} at a time. Split it into smaller files.`,
    );
  }
  return { fileName, rows, ignoredHeaders: ignored, skippedExampleRow };
}

// ------------------------------------------------------------------ reading
export async function readImportFile(file: File, columns: ImportColumn[], exampleKeys: string[]): Promise<ParsedFile> {
  if (file.size > MAX_FILE_BYTES) throw new ImportFileError("The file is larger than 10 MB.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    return finish(file.name, parseCsv(text), columns, exampleKeys);
  }
  if (name.endsWith(".xls")) {
    throw new ImportFileError("Old .xls files are not supported. In Excel use File → Save As → Excel Workbook (.xlsx), or CSV.");
  }
  if (!name.endsWith(".xlsx") && !name.endsWith(".xlsm")) {
    throw new ImportFileError("Upload an Excel (.xlsx) or CSV (.csv) file.");
  }

  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new ImportFileError("This file could not be read as an Excel workbook. Save it again as .xlsx (or CSV) and retry.");
  }
  const sheet =
    wb.worksheets.find((ws) => ws.state === "visible" && !/instruction|list/i.test(ws.name) && ws.actualRowCount > 0) ??
    wb.worksheets[0];
  if (!sheet) throw new ImportFileError("The workbook has no sheets.");

  const table: { rowNumber: number; cells: string[] }[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col - 1] = cellText(cell.value);
    });
    for (let i = 0; i < cells.length; i++) cells[i] ??= "";
    table.push({ rowNumber, cells });
  });
  return finish(file.name, table, columns, exampleKeys);
}

// RFC 4180-ish CSV parser: quotes, escaped quotes, newlines in quotes, BOM,
// and ; or tab separators (Excel in some locales).
export function parseCsv(text: string): { rowNumber: number; cells: string[] }[] {
  const src = text.replace(/^\ufeff/, "");
  const firstLine = src.slice(0, src.search(/\r?\n/) >= 0 ? src.search(/\r?\n/) : src.length);
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const);
  const delimiter = counts.sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",";

  const rows: { rowNumber: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let record = 1;
  const pushRow = () => {
    cells.push(field);
    if (cells.some((c) => c.trim())) rows.push({ rowNumber: record, cells });
    record++;
    cells = [];
    field = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      pushRow();
    } else field += ch;
  }
  if (field || cells.length) pushRow();
  return rows;
}

// ------------------------------------------------------------------ writing
const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(fileName: string, rows: unknown[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), fileName);
}

async function downloadWorkbook(wb: Workbook, fileName: string) {
  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    fileName,
  );
}

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1C263A" } };
const REQUIRED_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF7A2E2E" } };

function styleHeader(sheet: Worksheet, columns: ImportColumn[]) {
  const header = sheet.getRow(1);
  header.height = 22;
  header.eachCell((cell, col) => {
    const column = columns[col - 1];
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = column?.required ? REQUIRED_FILL : HEADER_FILL;
    cell.alignment = { vertical: "middle" };
    if (column?.note) cell.note = column.note;
  });
}

// .xlsx template: data sheet (bold frozen header, example row, dropdowns),
// a hidden Lists sheet feeding the long dropdowns, and an Instructions sheet.
export async function downloadTemplateXlsx(opts: {
  fileName: string;
  sheetName: string;
  columns: ImportColumn[];
  instructions: string[];
  title: string;
}) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = "EduRit";
  const sheet = wb.addWorksheet(opts.sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = opts.columns.map((c) => ({
    header: columnHeader(c),
    key: c.key,
    width: c.width ?? Math.max(14, c.header.length + 4),
    ...(c.text && { style: { numFmt: "@" } }),
  }));
  styleHeader(sheet, opts.columns);
  const example = sheet.addRow(Object.fromEntries(opts.columns.map((c) => [c.key, c.example ?? ""])));
  example.font = { italic: true, color: { argb: "FF6B7280" } };

  // Long lists live on a hidden sheet (inline lists are limited to 255 chars).
  const lists = wb.addWorksheet("Lists");
  lists.state = "hidden";
  let listCol = 0;
  opts.columns.forEach((c, index) => {
    if (!c.list?.length) return;
    const inline = `"${c.list.join(",")}"`;
    let formula = inline;
    if (inline.length > 250 || c.list.some((v) => v.includes(","))) {
      listCol++;
      const letter = lists.getColumn(listCol).letter;
      lists.getCell(`${letter}1`).value = c.header;
      c.list.forEach((v, i) => (lists.getCell(`${letter}${i + 2}`).value = v));
      formula = `Lists!$${letter}$2:$${letter}$${c.list.length + 1}`;
    }
    const letter = sheet.getColumn(index + 1).letter;
    for (let r = 2; r <= TEMPLATE_ROWS; r++) {
      sheet.getCell(`${letter}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: c.header,
        error: `Pick a value from the list (or keep your value if you are sure).`,
      };
    }
  });

  // Instructions
  const help = wb.addWorksheet("Instructions");
  help.columns = [{ width: 26 }, { width: 12 }, { width: 90 }];
  help.addRow([opts.title]).font = { bold: true, size: 14 };
  help.addRow([]);
  opts.instructions.forEach((line, i) => help.addRow([`${i + 1}. ${line}`]));
  help.addRow([]);
  const head = help.addRow(["Column", "Required", "What to enter"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell((cell) => (cell.fill = HEADER_FILL));
  opts.columns.forEach((c) => {
    const row = help.addRow([c.header, c.required ? "Yes" : "", c.note ?? ""]);
    row.alignment = { wrapText: true, vertical: "top" };
  });

  await downloadWorkbook(wb, `${opts.fileName}.xlsx`);
}

export function downloadTemplateCsv(fileName: string, columns: ImportColumn[]) {
  downloadCsv(`${fileName}.csv`, [columns.map(columnHeader), columns.map((c) => c.example ?? "")]);
}

// Rows that need fixing, with the template columns (so the file can be
// corrected and uploaded again) plus Errors / Warnings at the end.
export async function downloadErrorReport(opts: {
  fileName: string;
  sheetName: string;
  columns: ImportColumn[];
  rows: { row: ParsedRow; errors: string[]; warnings: string[] }[];
  format: "xlsx" | "csv";
}) {
  const header = [...opts.columns.map(columnHeader), "Errors", "Warnings", "Original Row"];
  const data = opts.rows.map(({ row, errors, warnings }) => [
    ...opts.columns.map((c) => row.values[c.key] ?? ""),
    errors.join("\n"),
    warnings.join("\n"),
    row.rowNumber,
  ]);
  if (opts.format === "csv") {
    downloadCsv(`${opts.fileName}.csv`, [header, ...data]);
    return;
  }
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(opts.sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    ...opts.columns.map((c) => ({
      header: columnHeader(c),
      width: c.width ?? Math.max(14, c.header.length + 4),
      ...((c.text || c.date) && { style: { numFmt: "@" } }),
    })),
    { header: "Errors", width: 60 },
    { header: "Warnings", width: 50 },
    { header: "Original Row", width: 12 },
  ];
  styleHeader(sheet, opts.columns);
  data.forEach((values) => {
    const row = sheet.addRow(values);
    row.alignment = { vertical: "top" };
    const errorsCell = row.getCell(opts.columns.length + 1);
    errorsCell.font = { color: { argb: "FFB91C1C" } };
    errorsCell.alignment = { wrapText: true, vertical: "top" };
    row.getCell(opts.columns.length + 2).alignment = { wrapText: true, vertical: "top" };
  });
  await downloadWorkbook(wb, `${opts.fileName}.xlsx`);
}
