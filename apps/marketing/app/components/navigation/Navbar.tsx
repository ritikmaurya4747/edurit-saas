"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { primaryNav } from "@/app/data/navigation";


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        data-nav-shell
        className={cn(
          "mx-auto flex h-14 max-w-[1180px] items-center justify-between rounded-full border px-3 pl-5 transition-all duration-300 sm:h-16",
          scrolled || open
            ? "border-line bg-white/85 shadow-[0_12px_40px_-16px_rgba(15,23,43,0.35)] backdrop-blur-xl"
            : "border-white/60 bg-white/70 shadow-[0_8px_30px_-18px_rgba(15,23,43,0.3)] backdrop-blur-xl"
        )}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="EduRit home">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent font-display text-[0.8rem] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,0.8)]">
            ER
          </span>
          <span className="font-display text-[1.15rem] font-extrabold tracking-tight text-ink">EduRit</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-nav={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className="rounded-full px-4 py-2 text-[0.92rem] font-medium text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink aria-[current=page]:bg-brand-soft aria-[current=page]:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/demo" className="rounded-full px-4 py-2 text-[0.92rem] font-medium text-ink-soft hover:text-ink">
            Log in
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-linear-to-r from-brand to-accent px-5 py-2.5 text-[0.92rem] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5"
          >
            Get started free
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper-sunk md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-[1180px] rounded-3xl border border-line bg-white/95 p-3 shadow-[0_24px_48px_-20px_rgba(15,23,43,0.4)] backdrop-blur-xl md:hidden">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className="block rounded-2xl px-4 py-3 text-[1.02rem] font-medium aria-[current=page]:bg-brand-soft aria-[current=page]:text-brand"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/demo" className="mt-2 flex justify-center rounded-full bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white">
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}
