import Link from "next/link";
import { formatDateTime, humanize } from "@/lib/utils/format";
import type { DashboardNotice } from "../data/dashboard.types";
import DashboardCard, { CardEmpty } from "./DashboardCard";

const priorityClass: Record<string, string> = {
  ALERT: "bg-red-50 text-red-600",
  EVENT: "bg-blue-50 text-blue-600",
  INFO: "bg-gray-100 text-gray-600",
};

const NoticesAttention = ({ notices }: { notices: DashboardNotice[] }) => {
  return (
    <DashboardCard title="Latest notices" href="/dashboard/notice" hrefLabel="View all notices">
      {notices.length === 0 ? (
        <CardEmpty>No notices have been published yet.</CardEmpty>
      ) : (
        <div className="mt-3 space-y-3">
          {notices.map((notice) => (
            <Link key={notice.id} href="/dashboard/notice" className="block w-full text-left">
              <p className="line-clamp-2 text-[10.5px] font-semibold leading-4 text-[#111827] hover:underline">
                {notice.title}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#718096]">
                <span
                  className={`rounded px-1 py-px text-[9px] font-semibold ${
                    priorityClass[notice.priority] ?? priorityClass.INFO
                  }`}
                >
                  {humanize(notice.priority)}
                </span>
                <span>{notice.targetRole === "ALL" ? "Everyone" : humanize(notice.targetRole)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateTime(notice.publishedAt)}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};

export default NoticesAttention;
