// Scoped print stylesheet: while mounted, printing shows only the element with
// `targetId` (the dashboard sidebar/header and page controls are hidden), and
// the app's fixed-height scroll containers are released so long documents
// flow onto multiple pages. Used by report cards and desk slips.
const PrintStyles = ({ targetId, pageMargin = "12mm" }: { targetId: string; pageMargin?: string }) => (
  <style>{`
@media print {
  @page { margin: ${pageMargin}; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body * { visibility: hidden; }
  #${targetId}, #${targetId} * { visibility: visible; }
  #${targetId} { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
  .h-screen { height: auto !important; }
  main { overflow: visible !important; }
  #${targetId} .print-page { break-after: page; page-break-after: always; }
  #${targetId} .print-page:last-child { break-after: auto; page-break-after: auto; }
  #${targetId} .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`}</style>
);

export default PrintStyles;
