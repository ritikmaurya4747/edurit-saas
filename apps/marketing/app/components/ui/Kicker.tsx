import { cn } from "@/app/lib/utils";


export function Kicker({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={cn(
        "mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em]",
        dark ? "border-white/15 bg-white/[0.06] text-white/80" : "border-brand/15 bg-brand-soft text-brand"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand to-accent" aria-hidden />
      {children}
    </div>
  );
}
