import { Settings2 } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="font-serif text-[20px] font-semibold leading-tight text-[#0d1626]">
          Good morning, Dr.
        </h1>

        <p className="mt-1 text-[11px] text-[#65758b]">
          Here&apos;s how GreenWood is running today.
        </p>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd9d0] bg-[#faf9f6] px-3 py-1.5 text-[10px] font-medium text-[#475569] transition-colors hover:bg-white"
      >
        <Settings2 className="h-3 w-3" />

        <span>Setup wizard</span>
      </button>
    </header>
  );
};

export default DashboardHeader;