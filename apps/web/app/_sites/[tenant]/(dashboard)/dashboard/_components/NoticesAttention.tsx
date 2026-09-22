import { ChevronRight } from "lucide-react";

import { dashboardNotices } from "../_data/dashboard.data";

const NoticesAttention = () => {
  return (
    <article className="rounded-xl border border-[#dedbd3] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-semibold text-[#162033]">
          Notices needing attention
        </h2>

        <button
          type="button"
          aria-label="View all notices"
          className="rounded-md p-1 text-[#8b96a5] transition-colors hover:bg-[#f5f4f0]"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {dashboardNotices.map((notice) => (
          <button
            key={notice.title}
            type="button"
            className="block w-full text-left"
          >
            <p className="text-[10.5px] font-semibold leading-4 text-[#111827]">
              {notice.title}
            </p>

            <p className="mt-0.5 text-[10px] text-[#718096]">
              {notice.meta}
            </p>
          </button>
        ))}
      </div>
    </article>
  );
};

export default NoticesAttention;