"use client";

import { cn } from "@/app/lib/utils";
import { useId, useState, type ReactNode, type KeyboardEvent } from "react";

type Tab = { id: string; label: ReactNode };

/**
 * Accessible tabs whose panels are rendered on the server and passed in,
 * so the client bundle only carries the switching logic.
 */
export function TabGroup({
  label,
  tabs,
  panels,
  className,
  listClassName,
  tabClassName,
  activeClassName,
  inactiveClassName,
  vertical,
}: {
  label: string;
  tabs: Tab[];
  panels: Record<string, ReactNode>;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  activeClassName: string;
  inactiveClassName: string;
  vertical?: boolean;
}) {
  const [active, setActive] = useState(tabs[0].id);
  const uid = useId();

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === keys[1] ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        data-tabs
        data-active={activeClassName}
        data-inactive={inactiveClassName}
        onKeyDown={onKeyDown}
        className={listClassName}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            data-tab={t.id}
            onClick={() => setActive(t.id)}
            className={cn(tabClassName, active === t.id ? activeClassName : inactiveClassName)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-panel-${t.id}`}
          aria-labelledby={`${uid}-tab-${t.id}`}
          data-panel={t.id}
          hidden={active !== t.id}
          className="min-w-0 animate-fade-up"
        >
          {panels[t.id]}
        </div>
      ))}
    </div>
  );
}
