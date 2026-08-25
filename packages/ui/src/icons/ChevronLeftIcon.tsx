import React from 'react';

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-chevron-left"
    aria-hidden="true"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export default ChevronLeftIcon;