import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
};

// Shared shell for the home dashboard cards (same look as the original mock).
const DashboardCard = ({ title, href, hrefLabel, children, className = "" }: DashboardCardProps) => (
  <article
    className={`rounded-xl border border-[#dedbd3] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
  >
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[12px] font-semibold text-[#162033]">{title}</h2>
      {href && (
        <Link
          href={href}
          aria-label={hrefLabel ?? `View all ${title.toLowerCase()}`}
          className="rounded-md p-1 text-[#8b96a5] transition-colors hover:bg-[#f5f4f0]"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
    {children}
  </article>
);

export const CardEmpty = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 rounded-lg border border-dashed border-[#e5e1d8] px-3 py-5 text-center text-[10.5px] text-[#8b96a5]">
    {children}
  </p>
);

export default DashboardCard;
