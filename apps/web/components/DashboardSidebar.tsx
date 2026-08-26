import ArrowLeftIcon from "@repo/ui/icons/ArrowLeftIcon";
import ArrowRightIcon from "@repo/ui/icons/ArrowRightIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarData } from "../config/sidebarData";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

const DashboardSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: DashboardSidebarProps) => {
  const pathname = usePathname();
  return (
    <div className="hidden lg:flex fixed top-0 left-0 h-full text-white z-50  transition-opacity duration-300 translate-x-0 border-r border-gray-200">
      <div className={`flex flex-col h-full ${isSidebarOpen ? "w-60" : "w-20"} transition-all duration-300`}>
        {/* Logo */}
        <div
          className={`flex py-2.5 border-b border-gray-200 ${isSidebarOpen
            ? "items-center gap-3 px-4"
            : "items-center justify-center"
            }`}
        >
          {/* Logo */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c8860f] text-sm font-semibold text-white">
            ER
          </div>

          {/* Sidebar Open Content */}
          {isSidebarOpen && (
            <div className="min-w-0">
              <h1 className="truncate text-md text-white font-bold">
                EduRit
              </h1>

              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-gray-400">
                ERP <span className="mx-1">•</span> Super Admin
              </p>
            </div>
          )}
        </div>

        <div
          className={`flex flex-col gap-1 mt-5 ${isSidebarOpen ? "pl-4" : "items-center"}`}
        >
          {sidebarData.map((item, index) => {
            const isActive = pathname === item.url;
            return (
              <div key={index}>
                <Link
                  href={item.url || "#"}
                  className="w-8 h-8 flex items-center"
                >
                  <div
                    className={`flex items-center  justify-center ${isSidebarOpen ? "gap-5" : "gap-2"
                      } ${isActive ? "text-white" : "text-[#5e91a2]"}`}
                  >
                    {item.icon}
                    {isSidebarOpen && (
                      <p className="text-white text-sm whitespace-nowrap">
                        {item.label}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute ${isSidebarOpen ? "left-54" : "left-15"
          } bottom-32 bg-white text-black rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-200`}
      >
        {isSidebarOpen ? (
          <ArrowLeftIcon className="w-4 h-4" />
        ) : (
          <ArrowRightIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default DashboardSidebar;
