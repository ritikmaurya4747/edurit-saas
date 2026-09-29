import { footerNav } from "@/app/data/navigation";
import { compliance } from "@/app/data/site";
import Link from "next/link";


const columns: { title: string; key: keyof typeof footerNav }[] = [
  { title: "Product", key: "product" },
  { title: "Solutions", key: "solutions" },
  { title: "Resources", key: "resources" },
  { title: "Company", key: "company" },
];

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-night text-paper">
      <div className="container-content py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="font-display text-[1.6rem] font-bold leading-none tracking-tight">
              EduRit<span className="text-accent">.</span>
            </span>
            </Link>
            <p className="mt-4 max-w-xs text-[0.9rem] leading-relaxed text-paper/60">
              The complete school management platform trusted by 500+
              institutions. Streamline operations, empower educators, and
              enhance student outcomes.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Compliance and reliability">
              {compliance.map((c) => (
                <li key={c} className="rounded-full border border-paper/20 px-3 py-1 text-[0.75rem] text-paper/75">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.key}>
              <p className="text-[0.9rem] font-medium">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {footerNav[col.key].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[0.9rem] text-paper/60 hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/15 pt-6 text-[0.85rem] text-paper/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} EduRit Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-paper">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-paper">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-paper">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
