import type { ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { PublicSchool } from "../types";

// Server-rendered chrome of the public admission page (header, footer, notices).

const websiteHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

const addressLine = (s: PublicSchool) =>
  [s.address, s.city, [s.state, s.pincode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export function SchoolLogo({ school, size = "lg" }: { school: PublicSchool; size?: "lg" | "sm" }) {
  const box = size === "lg" ? "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl" : "h-10 w-10 rounded-xl";
  if (school.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- school logo from any host
      <img
        src={school.logoUrl}
        alt={`${school.name} logo`}
        className={`${box} shrink-0 border border-white/30 bg-white object-contain p-1.5 shadow-lg`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center border border-white/20 bg-white/15 text-2xl font-extrabold text-white shadow-lg`}
    >
      {school.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function SchoolHeader({ school, academicYearLabel }: { school: PublicSchool; academicYearLabel: string | null }) {
  const subtitle = [school.affiliationBoard && `${school.affiliationBoard} affiliated`, school.city].filter(Boolean).join(" · ");
  return (
    <header className="relative overflow-hidden bg-linear-to-br from-blue-900 via-purple-900 to-blue-900 px-4 pb-20 pt-10 sm:pb-24 sm:pt-14">
      <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
      <div aria-hidden className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/5" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <SchoolLogo school={school} />
        <h1 className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{school.name}</h1>
        {subtitle && <p className="mt-1 text-sm text-blue-200">{subtitle}</p>}
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {academicYearLabel ? `Admissions open · ${academicYearLabel}` : "Online admission enquiry"}
        </p>
      </div>
    </header>
  );
}

function ContactItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

export function SchoolContacts({ school, className = "" }: { school: PublicSchool; className?: string }) {
  const address = addressLine(school);
  if (!address && !school.phone && !school.email && !school.website) return null;
  return (
    <ul className={`space-y-2 text-sm text-slate-600 ${className}`}>
      {address && <ContactItem icon={<MapPin className="h-4 w-4" />}>{address}</ContactItem>}
      {school.phone && (
        <ContactItem icon={<Phone className="h-4 w-4" />}>
          <a href={telHref(school.phone)} className="font-semibold text-blue-700 hover:underline">
            {school.phone}
          </a>
        </ContactItem>
      )}
      {school.email && (
        <ContactItem icon={<Mail className="h-4 w-4" />}>
          <a href={`mailto:${school.email}`} className="font-semibold text-blue-700 hover:underline">
            {school.email}
          </a>
        </ContactItem>
      )}
      {school.website && (
        <ContactItem icon={<Globe className="h-4 w-4" />}>
          <a
            href={websiteHref(school.website)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-700 hover:underline"
          >
            {school.website.replace(/^https?:\/\//i, "")}
          </a>
        </ContactItem>
      )}
    </ul>
  );
}

export function SchoolFooter({ school }: { school: PublicSchool }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-slate-800">{school.name}</p>
          <SchoolContacts school={school} className="mt-3" />
        </div>
        <p className="text-xs text-slate-400 sm:text-right">
          Your details are shared only with {school.name}.
          <br />
          Powered by <span className="font-bold text-slate-500">EduRit</span>
        </p>
      </div>
    </footer>
  );
}

export function ClosedNotice({ school }: { school: PublicSchool }) {
  const hasContact = !!(school.phone || school.email || school.website || school.address);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-900/5 sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl" aria-hidden>
        📋
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-800 sm:text-2xl">Admissions are closed right now</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {school.name} is not accepting online admission enquiries at the moment.
        {hasContact ? " Please contact the school office for admission details." : " Please check back later."}
      </p>
      {hasContact && (
        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-slate-50 p-4 text-left">
          <SchoolContacts school={school} />
        </div>
      )}
    </section>
  );
}

export function UnavailableNotice() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-900/5 sm:p-10">
      <h1 className="text-xl font-extrabold text-slate-800">This page is temporarily unavailable</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        We could not load the admission form. Please refresh the page in a minute.
      </p>
    </section>
  );
}
