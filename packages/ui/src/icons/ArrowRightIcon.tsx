import React from 'react';
interface ArrowRightIconProps {
  className?: string;
  stroke?: string;
}
const ArrowRightIcon = ({ className = 'w-5 h-4 text-gray-400', stroke = 'currentColor' }:ArrowRightIconProps) => {
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
      className={`lucide lucide-arrow-right ${className}`}
      aria-hidden="true"
    >
      <path d="M12 5l7 7-7 7" />
      <path d="M5 12h14" />
    </svg>
  );
};

export default ArrowRightIcon;
