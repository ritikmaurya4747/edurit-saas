import React from "react";

const ExclamationCircleIcon = ({ className = "" }) => {
  return (
    <svg
      className={`exclamation-circle-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="30"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer Circle */}
      <circle cx="256" cy="256" r="220" />

      {/* Exclamation Line */}
      <line x1="256" y1="140" x2="256" y2="300" />

      {/* Dot */}
      <circle cx="256" cy="360" r="20" fill="currentColor" />
    </svg>
  );
};

export default ExclamationCircleIcon;
