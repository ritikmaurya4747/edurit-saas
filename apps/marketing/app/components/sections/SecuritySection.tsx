import { ShieldCheck, KeyRound, Lock, DatabaseBackup } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { compliance } from "@/app/data/site";

const practices = [
  { icon: KeyRound, title: "Role-based access", description: "Principals, teachers, office staff, parents, and students each see only the records relevant to their role." },
  { icon: Lock, title: "Encrypted in transit", description: "Data moving between school devices and EduRit is encrypted, whether it's attendance or a report card." },
  { icon: ShieldCheck, title: "Controlled data access", description: "Records are scoped to the school that owns them, with access logged so admins can review changes." },
  { icon: DatabaseBackup, title: "Regular backups", description: "Academic and financial records are backed up routinely, so a lost device never means lost data." },
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-paper">
      <div className="container-content py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative flex justify-center">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-brand-soft md:h-80 md:w-80">
              <span aria-hidden className="absolute right-4 top-6 h-14 w-14 rounded-full bg-sun" />
              <span aria-hidden className="absolute bottom-8 left-2 h-9 w-9 rounded-full bg-accent" />
              <div className="flex h-40 w-40 items-center justify-center rounded-[36px] bg-night text-white shadow-[0_30px_50px_-20px_rgba(15,23,43,0.7)]">
                <ShieldCheck size={72} strokeWidth={1.5} aria-hidden />
              </div>
            </div>
          </div>
          <div>
            <SectionHeading
              kicker="Security"
              title="Student data deserves serious care"
              description="Schools trust us with sensitive records. We treat them with the same care you give your own files — plus an access trail."
            />
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Compliance and reliability">
              {compliance.map((c) => (
                <li key={c} className="flex items-center gap-2 rounded-full bg-night px-4 py-2 text-[0.85rem] font-semibold text-white">
                  <ShieldCheck size={15} className="text-sun" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {practices.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-3xl border border-line bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon size={20} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg tracking-tight">{title}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-soft">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
