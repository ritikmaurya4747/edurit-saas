import Link from "next/link";
import type { ReactNode } from "react";

// A Next.js link styled like the UI kit's Button (avoids nesting <button> in <a>).
const styles = {
  primary: "bg-[#1C263A] text-white hover:bg-[#111827] shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
};

const LinkButton = ({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof styles;
}) => (
  <Link
    href={href}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${styles[variant]}`}
  >
    {children}
  </Link>
);

export default LinkButton;
