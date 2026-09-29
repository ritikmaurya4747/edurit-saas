import { compliance } from "@/app/data/site";
import { ShieldCheck, KeyRound, Lock, DatabaseBackup } from "lucide-react";


const items = [
  { icon: KeyRound, t: "Role-based access" },
  { icon: Lock, t: "Encrypted in transit" },
  { icon: DatabaseBackup, t: "Regular backups" },
];

/** Compact security reassurance for the homepage. Full detail lives on /features#security. */
export function TrustStrip() {
  return (
    <section className="bg-paper-sunk">
      <div className="container-content pb-24 md:pb-32">
        <div data-reveal className="grid items-center gap-8 rounded-[32px] border border-line bg-white p-8 md:grid-cols-[auto_1fr] md:p-10">
          <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-brand to-accent text-white shadow-[0_20px_40px_-16px_rgba(79,70,229,0.7)]">
            <ShieldCheck size={38} aria-hidden />
          </span>
          <div>
            <h2 className="text-[1.7rem] leading-tight md:text-[2rem]">Student data deserves serious care.</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {compliance.map((c) => (
                <span key={c} className="rounded-full bg-night px-3.5 py-1.5 text-[0.8rem] font-semibold text-white">{c}</span>
              ))}
              {items.map(({ icon: Icon, t }) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-soft">
                  <Icon size={13} aria-hidden /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
