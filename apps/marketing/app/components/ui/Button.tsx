import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "light" | "ghost";
  size?: "md" | "lg";
  className?: string;
};

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-full font-medium transition-all duration-200 focus-visible:outline-2";

const variants = {
  primary:
    "bg-gradient-to-r from-brand to-accent text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,0.7)] hover:from-brand-deep hover:to-accent-deep hover:shadow-[0_14px_28px_-10px_rgba(79,70,229,0.8)]",
  secondary: "bg-paper-raised text-ink border border-line hover:border-brand/50",
  light: "bg-white text-brand hover:bg-brand-soft",
  ghost: "bg-transparent text-ink hover:text-brand underline decoration-line underline-offset-4",
};

const sizes = {
  md: "px-5 py-2.5 text-[0.95rem]",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonProps) {
  const withChip = variant === "primary" && size === "lg";
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], withChip && "pr-3", className)}
    >
      {children}
      {withChip && (
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </span>
      )}
    </Link>
  );
}
