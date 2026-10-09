"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { filterSidebar, isSidebarItemActive } from "@/config/sidebarData";
import { useCan } from "@/lib/auth/permissions";
import { tenantLogoutAction } from "@/app/sites/[tenant]/login/actions/tenant-auth";
import { formatRole, getInitials } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import LogoutIcon from "@repo/ui/icons/LogoutIcon";
import AlertIcon from "@repo/ui/icons/AlertIcon";

const MobileSidebar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const can = useCan();
  const sections = filterSidebar(can);
  const user = useUser();

  // Close the drawer whenever the route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // While the drawer is open: lock body scroll and close on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const isItemActive = (url: string) => isSidebarItemActive(pathname, url);

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="fixed top-0 left-0 z-40 flex h-14 w-full items-center justify-between border-b border-white/10 bg-[#16233F] px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white active:bg-white/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8860f] text-xs font-semibold text-white">
              ER
            </div>
            <span className="text-base font-bold text-white">EduRit</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/80 active:bg-white/10"
          >
            <AlertIcon />
            {/* Unread indicator dot */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#16233F]" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
            {getInitials(user?.name)}
          </div>
        </div>
      </header>

      {/* Backdrop overlay: click to close */}
      <div
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-50 cursor-pointer bg-black/50 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-in drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-[#16233F] text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8860f] text-sm font-semibold text-white">
              ER
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="text-base font-bold">EduRit</h1>
              {user?.tenantName && (
                <p className="truncate text-[11px] text-gray-400">{user.tenantName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-300 active:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.section} className={sectionIndex === 0 ? "" : "mt-5"}>
              <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {section.section}
              </p>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isItemActive(item.url);
                  return (
                    <Link
                      key={item.url}
                      href={item.url || "#"}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-l-4 py-3 pl-4 pr-3 transition-colors ${
                        active
                          ? "border-[#c8860f] bg-white/10 text-white"
                          : "border-transparent text-gray-400 active:bg-white/5"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.icon}
                      </span>
                      <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: user info + logout (respects iPhone safe area) */}
        <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-400">
                {user?.roleName ?? formatRole(user?.role)}
              </p>
            </div>
            <form action={tenantLogoutAction}>
              <button
                type="submit"
                aria-label="Logout"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-gray-300 active:bg-red-500/20 active:text-red-400"
              >
                <LogoutIcon />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MobileSidebar;