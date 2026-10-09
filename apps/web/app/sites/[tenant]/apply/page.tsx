import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplyForm from "./components/ApplyForm";
import { ClosedNotice, SchoolFooter, SchoolHeader, UnavailableNotice } from "./components/SchoolShell";
import { loadAdmissionForm } from "./data";

// Public online admission form: https://<school>.edurit.in/apply (no login).

export async function generateMetadata({ params }: PageProps<"/sites/[tenant]/apply">): Promise<Metadata> {
  const { tenant } = await params;
  const result = await loadAdmissionForm(tenant);
  if (result.kind !== "ok") return { title: "Admission Enquiry" };
  const { school } = result.data;
  return {
    title: `Admission Enquiry | ${school.name}`,
    description: `Apply online for admission at ${school.name}${school.city ? `, ${school.city}` : ""}.`,
  };
}

// Today in India (YYYY-MM-DD) for the date-of-birth picker limits.
const todayInIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export default async function ApplyPage({ params }: PageProps<"/sites/[tenant]/apply">) {
  const { tenant } = await params;
  const result = await loadAdmissionForm(tenant);
  if (result.kind === "not-found") notFound();

  if (result.kind === "error") {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
          <UnavailableNotice />
        </div>
      </main>
    );
  }

  const { school, enabled, message, classes, academicYearLabel } = result.data;
  const open = enabled && classes.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <SchoolHeader school={school} academicYearLabel={open ? academicYearLabel : null} />
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-2xl flex-1 px-4 pb-10 sm:-mt-14">
        {open ? (
          <ApplyForm
            slug={tenant.toLowerCase()}
            schoolName={school.name}
            classes={classes}
            message={message}
            today={todayInIndia()}
          />
        ) : (
          <ClosedNotice school={school} />
        )}
      </div>
      <SchoolFooter school={school} />
    </main>
  );
}
