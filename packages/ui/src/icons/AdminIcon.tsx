import React from "react";

const AdminIcon = ({ className = "" }) => {
  return (
    <svg
      className={`person-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      {/* Head */}
      <circle cx="256" cy="128" r="96" />

      {/* Body */}
      <path d="M256 256c-114.9 0-208 93.1-208 208h416c0-114.9-93.1-208-208-208z" />
    </svg>
  );
};

export default AdminIcon;
