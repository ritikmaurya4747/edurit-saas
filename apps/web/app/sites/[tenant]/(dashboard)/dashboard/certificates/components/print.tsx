import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import type { SchoolBlock } from "./types";

export const PRINT_ID = "certificate-print-area";

// Scoped print stylesheet: while mounted, printing shows only #certificate-print-area
// on A4 paper (sidebar, header and page controls are hidden).
export const PrintStyles = () => (
  <style>{`
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body * { visibility: hidden; }
  #${PRINT_ID}, #${PRINT_ID} * { visibility: visible; }
  #${PRINT_ID} { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
  .h-screen { height: auto !important; }
  main { overflow: visible !important; }
  #${PRINT_ID} .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`}</style>
);

export const SchoolLogo = ({ school, className }: { school: Pick<SchoolBlock, "name" | "logoUrl">; className?: string }) =>
  school.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={school.logoUrl} alt="" className={cn("shrink-0 object-contain", className)} />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-current font-bold uppercase",
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(school.name)}
    </div>
  );

// ---- words for dates on certificates ("Twelfth March Two Thousand Twelve") ----

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const ORDINALS = [
  "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh",
  "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth",
  "Twentieth", "Twenty-First", "Twenty-Second", "Twenty-Third", "Twenty-Fourth", "Twenty-Fifth", "Twenty-Sixth",
  "Twenty-Seventh", "Twenty-Eighth", "Twenty-Ninth", "Thirtieth", "Thirty-First",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
];

const below100 = (n: number): string =>
  n < 20 ? (ONES[n] ?? "") : `${TENS[Math.floor(n / 10)] ?? ""}${n % 10 ? `-${ONES[n % 10] ?? ""}` : ""}`;

function numberInWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (thousands) parts.push(`${below100(thousands)} Thousand`);
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(below100(rest));
  return parts.join(" ");
}

export function dateInWords(value?: string | null) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${ORDINALS[d] ?? d} ${MONTHS[m - 1] ?? ""} ${numberInWords(y)}`;
}

export function pronounsFor(gender?: string | null) {
  const g = (gender ?? "").trim().toLowerCase();
  if (g.startsWith("m")) return { He: "He", his: "his", him: "him", child: "son" };
  if (g.startsWith("f")) return { He: "She", his: "her", him: "her", child: "daughter" };
  return { He: "He/She", his: "his/her", him: "him/her", child: "ward" };
}
