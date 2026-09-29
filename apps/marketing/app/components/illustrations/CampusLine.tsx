/** Glowing line-art school skyline for dark sections: clock tower, wings, trees, bus. */
export function CampusLine({ className = "", id = "cl" }: { className?: string; id?: string }) {
  const u = (n: string) => `${id}-${n}`;
  return (
    <svg viewBox="0 -24 1440 284" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={u("stroke")} x1="0" x2="1">
          <stop offset="0" stopColor="#60A5FA" stopOpacity="0" />
          <stop offset=".25" stopColor="#60A5FA" stopOpacity=".7" />
          <stop offset=".5" stopColor="#A78BFA" stopOpacity=".95" />
          <stop offset=".75" stopColor="#60A5FA" stopOpacity=".7" />
          <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={u("fade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0F172B" stopOpacity="0" />
          <stop offset="1" stopColor="#0F172B" stopOpacity=".9" />
        </linearGradient>
        <filter id={u("glow")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="none" stroke={`url(#${u("stroke")})`} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" filter={`url(#${u("glow")})`}>
        <path d="M0 232 C 240 214, 420 222, 560 230 M880 230 C 1040 220, 1220 214, 1440 230" />
        <path d="M430 232 V160 L515 124 L600 160 V232" />
        <path d="M570 232 V120 L720 66 L870 120 V232" />
        <path d="M840 232 V160 L925 124 L1010 160 V232" />
        <path d="M690 66 V22 H750 V66 M682 26 L720 -6 L758 26" />
        <circle cx="720" cy="44" r="12" />
        <path d="M720 44 V36 M720 44 L726 47" />
        <path d="M692 232 V200 a28 28 0 0 1 56 0 V232" />
        {[600, 640, 780, 820].map((x) => [150, 186].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="18" height="20" rx="3" />))}
        {[455, 495, 865, 905].map((x) => <rect key={x} x={x} y="180" width="18" height="20" rx="3" />)}
        <circle cx="330" cy="196" r="26" />
        <path d="M330 222 V232" />
        <circle cx="1110" cy="192" r="30" />
        <path d="M1110 222 V232" />
        <rect x="150" y="196" width="120" height="34" rx="8" />
        <path d="M168 205 h18 v10 h-18z M196 205 h18 v10 h-18z M224 205 h18 v10 h-18z" />
      </g>
      {[[160, 60], [300, 30], [460, 80], [980, 40], [1160, 70], [1320, 26]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2} fill="#C4B5FD" opacity=".6" />
      ))}
      <rect x="0" y="160" width="1440" height="100" fill={`url(#${u("fade")})`} />
    </svg>
  );
}
