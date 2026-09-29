import type { SVGProps } from "react";

// Hand-drawn style classroom doodles (pencil, book, ruler, atom, paper plane, globe, star, A+).
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Pencil = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <path d="M10 38 L14 26 L34 6 L42 14 L22 34 Z" />
      <path d="M14 26 L22 34 M30 10 L38 18 M10 38 L16 36" />
    </g>
  </svg>
);

export const Book = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <path d="M6 12 C 14 8, 20 9, 24 13 C 28 9, 34 8, 42 12 L42 38 C 34 34, 28 35, 24 39 C 20 35, 14 34, 6 38 Z" />
      <path d="M24 13 L24 39 M11 17 L19 16 M11 22 L19 21 M29 16 L37 17 M29 21 L37 22" />
    </g>
  </svg>
);

export const Ruler = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <rect x="4" y="18" width="40" height="12" rx="2" transform="rotate(-30 24 24)" />
      <path d="M12 26 L14 29 M17 23 L19 27 M22 20 L24 23 M27 17 L29 21 M32 14 L34 17" transform="rotate(0)" />
    </g>
  </svg>
);

export const Atom = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <ellipse cx="24" cy="24" rx="18" ry="7" />
      <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(-60 24 24)" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </g>
  </svg>
);

export const Plane = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <path d="M4 22 L44 6 L32 42 L22 28 Z M22 28 L44 6" />
      <path d="M4 40 C 10 36, 12 42, 18 38" strokeDasharray="2 4" />
    </g>
  </svg>
);

export const Globe = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <circle cx="24" cy="20" r="14" />
      <path d="M10 20 L38 20 M24 6 C 18 12, 18 28, 24 34 C 30 28, 30 12, 24 6" />
      <path d="M14 38 L34 38 M24 34 L24 38" />
    </g>
  </svg>
);

export const Star = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <path d="M24 6 L29 18 L42 19 L32 27 L35 40 L24 33 L13 40 L16 27 L6 19 L19 18 Z" />
    </g>
  </svg>
);

export const APlus = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...p}>
    <g {...stroke}>
      <circle cx="24" cy="24" r="19" />
      <path d="M13 32 L20 14 L27 32 M15.5 26 L24.5 26 M33 18 L33 28 M28 23 L38 23" />
    </g>
  </svg>
);
