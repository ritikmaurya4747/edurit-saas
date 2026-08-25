import React from 'react'

const DownloadIcon = ({ className = "" }) => {
  return (
    <svg
      className={`download-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      {/* Arrow shaft */}
      <rect x="224" y="32" width="64" height="288" />
      
      {/* Arrow head */}
      <path d="M256 416L128 288h96V32h64v256h96L256 416z" />
      
      {/* Bottom line */}
      <rect x="32" y="448" width="448" height="64" rx="8" />
    </svg>
  );
};

export default DownloadIcon