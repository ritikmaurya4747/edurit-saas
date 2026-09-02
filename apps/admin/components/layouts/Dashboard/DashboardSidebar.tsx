"use client";

import ArrowLeftIcon from "@repo/ui/icons/ArrowLeftIcon";
import ArrowRightIcon from "@repo/ui/icons/ArrowRightIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarData } from "../../../config/sidebarData";

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
    <div className="hidden lg:flex fixed top-0 left-0 h-full text-white z-50 transition-opacity duration-300 translate-x-0 border-r border-gray-200">
      <div
        className={`flex flex-col h-full ${
          isSidebarOpen ? "w-60" : "w-20"
        } transition-all duration-300`}
      >
        {/* Logo */}
        <div
          className={`flex py-2.5 border-b border-gray-200 ${
            isSidebarOpen
              ? "items-center gap-3 px-4"
              : "items-center justify-center"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c8860f] text-sm font-semibold text-white">
            ER
          </div>

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

        {/* Nav Items */}
        <div className="flex flex-col py-5 overflow-y-auto px-2">
          {sidebarData.map((section, sectionIndex) => (
            <div key={section.section} className={sectionIndex === 0 ? "" : "mt-6"}>
              {isSidebarOpen && (
                <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {section.section}
                </p>
              )}

              <div className="flex flex-col gap-1">
                {section.items.map((item, index) => {
                  const isActive = pathname === item.url;

                  return (
                    <Link
                      key={index}
                      href={item.url || "#"}
                      className={`group relative flex items-center border-l-4 rounded-lg transition-colors duration-200 ${
                        isSidebarOpen
                          ? "gap-3 pl-4 pr-4 py-2.5"
                          : "justify-center py-2.5"
                      } ${
                        isActive
                          ? "border-[#c8860f] bg-white/10"
                          : "border-transparent hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center shrink-0 w-5 h-5 transition-colors duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-gray-400 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {isSidebarOpen && (
                        <p
                          className={`text-sm whitespace-nowrap transition-colors duration-200 ${
                            isActive
                              ? "font-semibold text-white"
                              : "font-medium text-gray-400 group-hover:text-white"
                          }`}
                        >
                          {item.label}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute ${
          isSidebarOpen ? "left-54" : "left-15"
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