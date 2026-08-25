import React from "react";

const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    className="lucide lucide-chevron-up"
    aria-hidden="true"
    {...props}
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export default ChevronUpIcon;
