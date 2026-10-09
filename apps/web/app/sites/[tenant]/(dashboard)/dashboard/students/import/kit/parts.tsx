"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, FileSpreadsheet, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RowStatus } from "./types";

export const STEPS = ["Template", "Upload", "Review", "Import"] as const;

export function Stepper({ step, onStep }: { step: number; onStep?: (step: number) => void }) {
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm sm:gap-3 sm:px-5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        const clickable = !!onStep && done;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStep?.(n)}
              className={cn("flex items-center gap-2", clickable ? "cursor-pointer" : "cursor-default")}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
                  done && "border-green-600 bg-green-600 text-white",
                  active && "border-[#1C263A] bg-[#1C263A] text-white",
                  !done && !active && "border-gray-300 bg-white text-gray-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              <span className={cn("text-xs font-bold sm:text-sm", active ? "text-gray-900" : "text-gray-500")}>{label}</span>
            </button>
            {n < STEPS.length && <span className="h-px w-6 bg-gray-200 sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressBar({ done, total, label }: { done: number; total: number; label: ReactNode }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="h-full rounded-full bg-[#1C263A] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Dropzone({
  onFile,
  disabled,
  fileName,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  fileName?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !disabled) onFile(file);
      }}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) input.current?.click();
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
        over ? "border-[#1C263A] bg-[#1C263A]/5" : "border-gray-300 bg-gray-50/60 hover:bg-gray-50",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      {fileName ? <FileSpreadsheet className="h-9 w-9 text-green-700" /> : <UploadCloud className="h-9 w-9 text-gray-400" />}
      <p className="text-sm font-bold text-gray-800">{fileName ?? "Drag & drop your file here, or click to choose"}</p>
      <p className="text-xs text-gray-500">Excel (.xlsx) or CSV · up to 2,000 rows</p>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

const statusStyle: Record<RowStatus, { label: string; className: string }> = {
  ok: { label: "Ready", className: "bg-green-50 text-green-700 border-green-200" },
  warning: { label: "Warning", className: "bg-amber-50 text-amber-700 border-amber-200" },
  error: { label: "Error", className: "bg-red-50 text-red-700 border-red-200" },
};

export function StatusPill({ status }: { status: RowStatus }) {
  const s = statusStyle[status];
  return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold", s.className)}>{s.label}</span>;
}

export function SummaryChip({
  tone,
  icon,
  label,
  count,
  active,
  onClick,
}: {
  tone: "green" | "amber" | "red" | "gray";
  icon: ReactNode;
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    gray: "border-gray-200 bg-white text-gray-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-shadow cursor-pointer",
        tones[tone],
        active && "ring-2 ring-[#1C263A]/40",
      )}
    >
      {icon}
      <span className="text-lg leading-none">{count.toLocaleString()}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
