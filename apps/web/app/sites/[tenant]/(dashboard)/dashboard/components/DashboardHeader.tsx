"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";

type DashboardHeaderProps = {
  greeting: string;
  firstName: string;
  schoolName: string;
  subtitle?: string;
  showSetupWizard?: boolean;
};

const DashboardHeader = ({ greeting, firstName, schoolName, subtitle, showSetupWizard }: DashboardHeaderProps) => {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight text-[#0d1626]">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>

        <p className="mt-1 text-[11px] text-[#65758b]">
          Here&apos;s how {schoolName || "your school"} is running today.
          {subtitle ? <span className="ml-1 text-[#8b96a5]">{subtitle}</span> : null}
        </p>
      </div>

      {showSetupWizard && (
        <Link
          href="/dashboard/academics"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#ddd9d0] bg-[#faf9f6] px-3 py-1.5 text-[10px] font-medium text-[#475569] transition-colors hover:bg-white sm:self-auto"
        >
          <Settings2 className="h-3 w-3" />
          <span>Setup wizard</span>
        </Link>
      )}
    </header>
  );
};

export default DashboardHeader;
