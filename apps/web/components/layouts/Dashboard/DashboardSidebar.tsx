"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { filterSidebar, isSidebarItemActive } from "@/config/sidebarData";
import { useCan, useIsPortalUser } from "@/lib/auth/permissions";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
}

const DashboardSidebar = ({ isSidebarOpen }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const can = useCan();
  const portalUser = useIsPortalUser();
  const sections = filterSidebar(can, portalUser);

  const fade = `transition-opacity duration-200 ease-in-out ${isSidebarOpen ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
    }`;

  return (
    <div className="hidden lg:flex fixed top-0 left-0 h-full text-white z-50 border-r border-gray-200">
      <div
        className={`flex flex-col h-full overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? "w-60" : "w-20"
          }`}
      >
        <div className="flex items-center gap-3 py-3 px-5.5 border-b border-gray-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c8860f] text-sm font-semibold text-white">
            ER
          </div>
          <h1 className={`truncate text-md text-white font-bold whitespace-nowrap ${fade}`}>
            EduRit
          </h1>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col py-5 overflow-y-auto overflow-x-hidden px-2">
          {sections.map((section, sectionIndex) => (
            <div
              key={section.section}
              className={`transition-[margin,padding] duration-300 ease-in-out ${sectionIndex === 0
                ? ""
                : isSidebarOpen
                  ? "mt-2"
                  : "mt-1 pt-0.5 border-white/10"
                }`}
            >
              <p
                className={`px-4 overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-500 transition-all duration-300 ease-in-out ${isSidebarOpen
                  ? "h-4 mb-2 opacity-100 delay-100"
                  : "h-0 mb-0 opacity-0 pointer-events-none"
                  }`}
              >
                {section.section}
              </p>

              <div className="flex flex-col gap-1">
                {section.items.map((item, index) => {
                  const isActive = isSidebarItemActive(pathname, item.url);

                  return (
                    <Link
                      key={index}
                      href={item.url || "#"}
                      title={!isSidebarOpen ? item.label : undefined}
                      className={`group relative flex items-center gap-3 border-l-4 rounded-lg py-2.5 pl-4.5 pr-3 transition-colors duration-200 ${isActive
                        ? "border-[#c8860f] bg-white/10"
                        : "border-transparent hover:bg-white/5"
                        }`}
                    >
                      <span
                        className={`flex items-center justify-center shrink-0 w-5 h-5 transition-colors duration-200 ${isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-white"
                          }`}
                      >
                        {item.icon}
                      </span>

                      <p
                        className={`text-sm whitespace-nowrap transition-colors duration-200 ${fade} ${isActive
                          ? "font-semibold text-white"
                          : "font-medium text-gray-400 group-hover:text-white"
                          }`}
                      >
                        {item.label}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;