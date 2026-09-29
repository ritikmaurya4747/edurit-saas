import { cn } from "@/app/lib/utils";
import type { ReactNode } from "react";

/** Browser-style frame that makes a coded UI read as a real product screen. */
export function AppWindow({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_0_#E2E8F0,0_30px_60px_-30px_rgba(15,23,43,0.45)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-clay/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-sun" />
          <span className="h-2.5 w-2.5 rounded-full bg-meadow-bright" />
        </div>
        <p className="truncate text-[0.72rem] font-medium text-ink-faint">{title}</p>
      </div>
      <div className="text-[0.78rem] text-ink">{children}</div>
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "green" | "red" | "amber" | "violet" | "sky";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-meadow-soft text-meadow",
    red: "bg-clay-soft text-clay",
    amber: "bg-sun-soft text-[#B45309]",
    violet: "bg-brand-soft text-brand-deep",
    sky: "bg-teal-soft text-[#0F766E]",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Avatar({ name, tone = 0 }: { name: string; tone?: number }) {
  const bg = ["bg-brand-soft text-brand-deep", "bg-accent-soft text-accent-deep", "bg-teal-soft text-[#0F766E]", "bg-sun-soft text-[#B45309]", "bg-meadow-soft text-meadow"];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold", bg[tone % bg.length])}>
      {initials}
    </span>
  );
}
