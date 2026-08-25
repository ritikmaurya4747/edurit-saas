import React from 'react';

const DragIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M10 3v14M3 10h14" />
    <path d="M10 3l-2 2M10 3l2 2M10 17l-2-2M10 17l2-2M17 10l-2-2M17 10l-2 2M3 10l2-2M3 10l2 2" />
  </svg>
);

export default DragIcon;