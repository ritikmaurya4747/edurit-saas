import React from "react";

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    shapeRendering="geometricPrecision" 
  >
    <circle cx="7.5" cy="7.5" r="5.5" />
    <line x1="11.5" y1="11.5" x2="16" y2="16" />
  </svg>
);

export default SearchIcon;
