"use client";

import { formatDate, getInitials } from "@/lib/utils/format";
import { SchoolLogo } from "./print";
import type { IdCardData, SchoolBlock } from "./types";

// CR80 card (85.6mm × 54mm), sized in mm so the printout matches a real card.
const IdCard = ({ school, card, validUpto }: { school: SchoolBlock; card: IdCardData; validUpto?: string | null }) => (
  <div
    className="print-avoid-break flex h-[54mm] w-[85.6mm] shrink-0 flex-col overflow-hidden rounded-[3mm] border border-gray-300 bg-white text-gray-900 shadow-sm print:shadow-none"
    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
  >
    <div className="flex items-center gap-[2mm] bg-[#1C263A] px-[3mm] py-[1.6mm] text-white">
      <SchoolLogo school={school} className="h-[8mm] w-[8mm] rounded-sm bg-white/95 text-[6pt] text-[#1C263A]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[8.5pt] font-bold uppercase leading-tight">{school.name}</p>
        {school.fullAddress && <p className="truncate text-[5.5pt] leading-tight opacity-80">{school.fullAddress}</p>}
      </div>
    </div>

    <div className="flex flex-1 gap-[3mm] px-[3mm] pt-[2mm]">
      <div className="flex flex-col items-center gap-[1mm]">
        {card.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photoUrl} alt="" className="h-[23mm] w-[19mm] rounded-[1mm] border border-gray-300 object-cover" />
        ) : (
          <div className="flex h-[23mm] w-[19mm] items-center justify-center rounded-[1mm] border border-gray-300 bg-[#1C263A]/10 text-[14pt] font-bold text-[#1C263A]">
            {getInitials(card.name)}
          </div>
        )}
        <span className="rounded-sm bg-[#c8a24a] px-[1.5mm] text-[5pt] font-bold uppercase tracking-wider text-white">
          Student
        </span>
      </div>
      <div className="min-w-0 flex-1 text-[6.5pt] leading-[1.5]">
        <p className="truncate text-[9pt] font-bold leading-tight text-[#1C263A]">{card.name}</p>
        <div className="mt-[1mm] space-y-0">
          <Row label="Class" value={[card.classSection, card.rollNumber != null ? `Roll ${card.rollNumber}` : null].filter(Boolean).join(" · ")} />
          <Row label="Adm. No." value={card.admissionNumber} />
          <Row label="D.O.B." value={card.dob ? formatDate(card.dob) : null} />
          <Row label="Blood Grp" value={card.bloodGroup} />
          <Row label="Guardian" value={card.guardianPhone} />
        </div>
      </div>
    </div>

    <div className="flex items-end justify-between px-[3mm] pb-[1.2mm] text-[5.5pt]">
      <span>
        Valid upto: <b>{validUpto ? formatDate(validUpto) : "—"}</b>
      </span>
      <span className="border-t border-gray-500 px-[2mm] pt-[0.3mm] font-semibold">Principal</span>
    </div>
    <div className="h-[1.4mm] bg-[#c8a24a]" />
  </div>
);

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <p className="flex gap-[1mm] truncate">
    <span className="w-[13mm] shrink-0 text-gray-500">{label}</span>
    <span className="truncate font-bold">{value || "—"}</span>
  </p>
);

export default IdCard;
