"use client";

import { tenantLogoutAction } from "@/app/sites/[tenant]/login/actions/tenant-auth";
import { formatRole, getInitials } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import { BurgerMenuLeft, BurgerMenuRight } from "@repo/ui/icons";
import AlertIcon from "@repo/ui/icons/AlertIcon";
import LogoutIcon from "@repo/ui/icons/LogoutIcon";
import SearchIcon from "@repo/ui/icons/SearchIcon";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

const DashboardHeader = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: DashboardSidebarProps) => {
  const user = useUser();

  return (
    <div className="hidden md:flex items-center justify-between px-5 py-2.5 mt-15 lg:mt-0">
      <div className="text-primary flex gap-2 text-sm font-semibold leading-5">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? (
            <BurgerMenuLeft stroke="#000000" className="cursor-pointer" />
          ) : (
            <BurgerMenuRight stroke="#000000" className="cursor-pointer" />
          )}
        </button>
      </div>
      <div className="text-primary flex gap-2 text-sm font-semibold leading-5">
        <h2 className="text-sm">{user?.tenantName}</h2>
        {" / "}
        <h2 className="text-sm">Dashboard</h2>
      </div>

      <div className="flex gap-4 items-center">
        {/* search input */}
        <div className="relative">
          <input
            name=""
            type="search"
            className="bg-white pl-4 w-72 appearance-none rounded-xl border border-gray-300 px-7 py-2.5 leading-5 text-[#7E7E7E] backdrop-blur-2xl placeholder:text-[#7E7E7E] focus:outline-none text-base placeholder:text-base"
            placeholder="Search ..."
          />
          <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center">
            <SearchIcon className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Right side content */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
        >
          <AlertIcon />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-8 w-px bg-gray-200" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
            {getInitials(user?.name)}
          </div>

          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {user?.roleName ?? formatRole(user?.role)}
            </p>
          </div>
        </div>

        {/* Logout: server action form se */}
        <form action={tenantLogoutAction}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm active:scale-95 cursor-pointer"
            aria-label="Logout"
          >
            <LogoutIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardHeader;