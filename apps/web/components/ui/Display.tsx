"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { PageMeta } from "@/lib/api/client";
import { Button } from "./Button";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-1 font-serif text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex overflow-x-auto border-b border-gray-200", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors cursor-pointer",
            active === tab.id ? "border-[#1C263A] text-[#1C263A]" : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export type BadgeTone = "green" | "red" | "yellow" | "orange" | "blue" | "purple" | "gray";

const tones: Record<BadgeTone, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
};

export function Badge({ tone = "gray", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const border = { default: "border-[#dedbd3]", danger: "border-red-400", warning: "border-amber-400", success: "border-green-400" }[tone];
  const color = { default: "text-[#0d1626]", danger: "text-red-600", warning: "text-amber-600", success: "text-green-700" }[tone];
  return (
    <div className={cn("rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", border)}>
      <p className="text-[11px] font-medium text-[#52637a]">{label}</p>
      <p className={cn("mt-1 font-serif text-2xl leading-none", color)}>{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-[#718096]">{hint}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-16 text-sm text-gray-500", className)}>
      <svg className="h-5 w-5 animate-spin text-[#1C263A]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/50 py-12 text-center">
      <p className="text-sm font-semibold text-red-700">{message || "Something went wrong while loading data."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center">
      <p className="text-sm font-bold text-gray-800">{title}</p>
      {description && <p className="max-w-sm text-xs text-gray-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Pagination({ meta, onPageChange }: { meta?: PageMeta; onPageChange: (page: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
      <span>
        Showing {from}–{to} of {meta.total}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Wraps a data region with loading / error / empty handling.
export function QueryState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  empty,
  children,
}: {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (isEmpty && empty) return <>{empty}</>;
  return <>{children}</>;
}
