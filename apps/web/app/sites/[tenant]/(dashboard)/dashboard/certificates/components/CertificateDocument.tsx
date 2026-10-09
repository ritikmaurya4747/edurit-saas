"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate, humanize } from "@/lib/utils/format";
import { SchoolLogo, dateInWords, pronounsFor } from "./print";
import { TYPE_META, type CertificateDetails, type CertificateSnapshot, type DocumentType, type SchoolBlock } from "./types";

interface Props {
  type: DocumentType;
  snapshot: CertificateSnapshot;
  details: CertificateDetails;
  serialNumber?: string | null;
  issueDate?: string | null;
  revoked?: boolean;
}

const fmt = (value?: string | null) => (value ? formatDate(value) : "—");

// Formal A4 certificate: letterhead, serial + date, title, body, signatures.
// Rendered from a live preview or from the snapshot stored at issue time.
const CertificateDocument = ({ type, snapshot, details, serialNumber, issueDate, revoked }: Props) => {
  const { school, student, enrollment } = snapshot;
  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white text-gray-900 shadow-lg print:max-w-none print:shadow-none"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <div className="relative flex min-h-[260mm] flex-col border-[3px] border-double border-[#1C263A] p-6 sm:p-10 print:min-h-[272mm] print:p-[12mm]">
        {revoked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-[24deg] rounded border-4 border-red-600/70 px-6 py-2 text-5xl font-black tracking-[0.3em] text-red-600/60">
              REVOKED
            </span>
          </div>
        )}
        {!serialNumber && (
          <span className="absolute right-3 top-3 rounded bg-amber-100 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-amber-800 print:hidden">
            Preview — not issued
          </span>
        )}

        <Letterhead school={school} />

        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <span>
            Sr. No.: <b className="font-sans tracking-wide">{serialNumber ?? "(assigned on issue)"}</b>
          </span>
          <span>
            Date: <b>{fmt(issueDate)}</b>
          </span>
        </div>

        <h2 className="mt-8 text-center text-xl font-bold uppercase tracking-[0.25em] underline decoration-1 underline-offset-8 sm:text-2xl">
          {TYPE_META[type].title}
        </h2>

        <div className="mt-8 flex-1 text-[14px] leading-7">
          {type === "TC" && <TcBody snapshot={snapshot} details={details} />}
          {type === "BONAFIDE" && <BonafideBody snapshot={snapshot} details={details} issueDate={issueDate} />}
          {type === "CHARACTER" && <CharacterBody snapshot={snapshot} details={details} issueDate={issueDate} />}
        </div>

        <div className="print-avoid-break mt-16 grid grid-cols-3 items-end gap-4 text-center text-sm">
          <Signature label="Class Teacher" sub={enrollment?.label} />
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gray-400 text-[10px] uppercase tracking-wider text-gray-400">
            School Seal
          </div>
          <Signature label="Principal" sub={school.principalName || undefined} />
        </div>
        <p className="mt-6 text-center font-sans text-[10px] text-gray-400">
          Issued to {student.name} (Adm. No. {student.admissionNumber}). Verify with the school office quoting the serial number.
        </p>
      </div>
    </div>
  );
};

export const Letterhead = ({ school }: { school: SchoolBlock }) => {
  const contact = [
    school.phone && `Phone: ${school.phone}`,
    school.email && `Email: ${school.email}`,
    school.website && school.website.replace(/^https?:\/\//, ""),
  ].filter(Boolean);
  const affiliation = [
    school.affiliationBoard && `Affiliated to ${school.affiliationBoard}`,
    school.affiliationNumber && `Affiliation No. ${school.affiliationNumber}`,
    school.establishedYear && `Estd. ${school.establishedYear}`,
  ].filter(Boolean);
  return (
    <header className="border-b-[3px] border-double border-[#1C263A] pb-4">
      <div className="flex items-center gap-4">
        <SchoolLogo school={school} className="h-16 w-16 text-lg text-[#1C263A] sm:h-20 sm:w-20 sm:text-xl" />
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide text-[#1C263A] sm:text-[26px] sm:leading-8">{school.name}</h1>
          {school.legalName && school.legalName !== school.name && (
            <p className="text-xs italic text-gray-600">({school.legalName})</p>
          )}
          {school.fullAddress && <p className="mt-1 text-xs text-gray-700 sm:text-sm">{school.fullAddress}</p>}
          {contact.length > 0 && <p className="text-[11px] text-gray-600">{contact.join("  |  ")}</p>}
          {affiliation.length > 0 && (
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700">{affiliation.join("  •  ")}</p>
          )}
        </div>
        {/* balances the logo so the name stays centred */}
        <div className="hidden h-16 w-16 shrink-0 sm:block sm:h-20 sm:w-20" />
      </div>
    </header>
  );
};

const Signature = ({ label, sub }: { label: string; sub?: string | null }) => (
  <div>
    <div className="mx-auto mb-1 h-px w-36 bg-gray-700" />
    <p className="font-bold">{label}</p>
    {sub && <p className="text-xs text-gray-600">{sub}</p>}
  </div>
);

const Blank = ({ children }: { children?: ReactNode }) => (
  <b className={cn("border-b border-dotted border-gray-500 px-1", !children && "inline-block min-w-24")}>{children || " "}</b>
);

const parentLine = (s: CertificateSnapshot["student"]) =>
  s.fatherName ?? s.guardianName ?? s.motherName ?? null;

function TcBody({ snapshot, details }: { snapshot: CertificateSnapshot; details: CertificateDetails }) {
  const { student, enrollment, attendance, lastExam } = snapshot;
  const rows: [string, ReactNode][] = [
    ["Name of the student", student.name],
    ["Admission number", student.admissionNumber],
    ["Father's / Guardian's name", student.fatherName ?? student.guardianName],
    ["Mother's name", student.motherName],
    [
      "Date of birth (in figures and words)",
      student.dob ? (
        <>
          {fmt(student.dob)} <span className="font-normal italic">({dateInWords(student.dob)})</span>
        </>
      ) : null,
    ],
    ["Gender", student.gender ? humanize(student.gender) : null],
    ["Date of admission in the school", fmt(student.admissionDate)],
    [
      "Class in which the student last studied",
      enrollment ? `${enrollment.label} (Session ${enrollment.academicYear})` : null,
    ],
    ["Roll number", enrollment?.rollNumber != null ? String(enrollment.rollNumber) : null],
    [
      "Last examination taken and result",
      lastExam
        ? `${lastExam.examName} (${lastExam.academicYear}) — ${lastExam.result}, ${lastExam.percent}% (Grade ${lastExam.grade})`
        : null,
    ],
    [
      "Attendance (days present / working days)",
      attendance && attendance.total
        ? `${attendance.present} / ${attendance.total}${attendance.percent != null ? ` (${attendance.percent}%)` : ""} — ${attendance.academicYear}`
        : null,
    ],
    ["Date of leaving the school", fmt(details.leavingDate)],
    ["Reason for leaving", details.reason],
    ["General conduct", details.conduct],
    ["Any other remarks", details.remarks],
  ];
  return (
    <>
      <table className="w-full border-collapse text-[13px] leading-6">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label} className="align-top">
              <td className="w-8 py-1">{i + 1}.</td>
              <td className="w-[44%] py-1 pr-3">{label}</td>
              <td className="border-b border-dotted border-gray-400 py-1 font-semibold">{value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-[13px] italic">
        Certified that the above information is in accordance with the school records.
      </p>
    </>
  );
}

function BonafideBody({
  snapshot,
  details,
  issueDate,
}: {
  snapshot: CertificateSnapshot;
  details: CertificateDetails;
  issueDate?: string | null;
}) {
  const { student, enrollment, school } = snapshot;
  const p = pronounsFor(student.gender);
  const parent = parentLine(student);
  return (
    <div className="space-y-5 text-justify">
      <p className="indent-12">
        This is to certify that <Blank>{student.name}</Blank>
        {parent && (
          <>
            , {p.child} of <Blank>{parent}</Blank>
            {student.fatherName && student.motherName && (
              <>
                {" "}and <Blank>{student.motherName}</Blank>
              </>
            )}
          </>
        )}
        , bearing Admission No. <Blank>{student.admissionNumber}</Blank>, is a bonafide student of{" "}
        <b>{school.name}</b>
        {enrollment ? (
          <>
            {" "}studying in <Blank>{enrollment.label}</Blank>
            {enrollment.rollNumber != null && <> (Roll No. {enrollment.rollNumber})</>} during the academic session{" "}
            <Blank>{enrollment.academicYear}</Blank>
          </>
        ) : null}
        .
      </p>
      {student.dob && (
        <p className="indent-12">
          {p.his.charAt(0).toUpperCase() + p.his.slice(1)} date of birth as per the school
          records is <Blank>{fmt(student.dob)}</Blank> ({dateInWords(student.dob)}).
        </p>
      )}
      <p className="indent-12">
        This certificate is issued on {p.his} request{issueDate ? <> on {fmt(issueDate)}</> : null} for the purpose of{" "}
        <Blank>{details.purpose}</Blank>.
      </p>
      {details.remarks && <p className="indent-12">{details.remarks}</p>}
    </div>
  );
}

function CharacterBody({
  snapshot,
  details,
  issueDate,
}: {
  snapshot: CertificateSnapshot;
  details: CertificateDetails;
  issueDate?: string | null;
}) {
  const { student, enrollment, school } = snapshot;
  const p = pronounsFor(student.gender);
  const parent = parentLine(student);
  const current = student.status === "ACTIVE";
  return (
    <div className="space-y-5 text-justify">
      <p className="indent-12">
        This is to certify that <Blank>{student.name}</Blank>
        {parent && (
          <>
            , {p.child} of <Blank>{parent}</Blank>
          </>
        )}
        , Admission No. <Blank>{student.admissionNumber}</Blank>, {current ? "is" : "was"} a student of{" "}
        <b>{school.name}</b> {current ? "since" : "from"} <Blank>{fmt(student.admissionDate)}</Blank>
        {!current && issueDate ? (
          <>
            {" "}to <Blank>{fmt(issueDate)}</Blank>
          </>
        ) : null}
        {enrollment && (
          <>
            {" "}and {current ? "is studying" : "last studied"} in <Blank>{enrollment.label}</Blank> (session{" "}
            {enrollment.academicYear})
          </>
        )}
        .
      </p>
      <p className="indent-12">
        To the best of our knowledge, {p.his} conduct and character during this period have been{" "}
        <Blank>{(details.conduct || "Good").toLowerCase()}</Blank>. {p.He} has not been involved in any act of indiscipline.
      </p>
      {details.remarks && <p className="indent-12">{details.remarks}</p>}
      <p className="indent-12">We wish {p.him} every success in life.</p>
    </div>
  );
}

export default CertificateDocument;
