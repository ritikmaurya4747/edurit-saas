"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CalendarDays, CheckCheck, Info, X } from "lucide-react";
import { useApiQuery } from "@/lib/api/hooks";
import { useUser } from "@/providers/user-provider";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface NotificationItem {
  id: string;
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  description: string;
  href: string;
  count?: number;
  createdAt: string;
}

const severityStyles = {
  danger: { icon: AlertTriangle, className: "bg-red-50 text-red-600" },
  warning: { icon: AlertTriangle, className: "bg-amber-50 text-amber-600" },
  info: { icon: Info, className: "bg-blue-50 text-blue-600" },
};

// Read state lives in the browser: items newer than "last seen" are unread.
const storageKey = (userId?: string) => `edurit.notifications.lastSeen.${userId ?? "anon"}`;

const readLastSeen = (key: string) => {
  try {
    return Number(window.localStorage.getItem(key) ?? 0);
  } catch {
    return 0;
  }
};

export default function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const user = useUser();
  const key = storageKey(user?.id);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useApiQuery<{ items: NotificationItem[] }>(
    ["notifications"],
    "notifications",
    undefined,
    { refetchInterval: 120_000, staleTime: 60_000 },
  );
  const items = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => setLastSeen(readLastSeen(key)), [key]);

  const unread = items.filter((i) => new Date(i.createdAt).getTime() > lastSeen).length;

  const markAllRead = useCallback(() => {
    const now = Date.now();
    setLastSeen(now);
    try {
      window.localStorage.setItem(key, String(now));
    } catch {
      // storage unavailable (private mode): read state just won't persist
    }
  }, [key]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refetch();
        }}
        className={cn(
          "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors",
          tone === "light"
            ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            : "text-white/80 active:bg-white/10",
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2",
              tone === "light" ? "ring-white" : "ring-[#16233F]",
            )}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-16 z-[70] flex max-h-[75vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              <p className="text-[11px] text-gray-500">{unread ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#1C263A] hover:bg-gray-100"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
            ) : isError ? (
              <div className="px-4 py-8 text-center text-sm text-red-600">
                Couldn&apos;t load notifications.{" "}
                <button type="button" onClick={() => refetch()} className="cursor-pointer font-semibold underline">
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <CheckCheck className="mx-auto mb-2 h-6 w-6 text-green-500" />
                <p className="text-sm font-semibold text-gray-800">Nothing needs your attention</p>
                <p className="mt-1 text-xs text-gray-500">Approvals, overdue fees and new notices will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isUnread = new Date(item.createdAt).getTime() > lastSeen;
                  const style = severityStyles[item.severity];
                  const Icon = item.type === "EVENT" ? CalendarDays : style.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50", isUnread && "bg-blue-50/40")}
                      >
                        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", style.className)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold leading-snug text-gray-900">{item.title}</span>
                            {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-gray-500">{item.description}</span>
                          <span className="mt-1 block text-[10px] text-gray-400">{formatDateTime(item.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
