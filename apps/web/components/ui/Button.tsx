"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-[#1C263A] text-white hover:bg-[#111827] shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  outline: "bg-transparent text-[#1C263A] border border-[#1C263A]/30 hover:bg-[#1C263A]/5",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-lg gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
