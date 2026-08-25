import React from 'react';

const ArrowLeftIcon = ({ className = 'w-6 h-6 cursor-pointer', stroke = 'currentColor' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-arrow-left ${className}`}
      aria-hidden="true"
    >
      <path d="M12 19L5 12l7-7" />
      <path d="M19 12H5" />
    </svg>
  );
};

export default ArrowLeftIcon;
