import React from 'react'

const FolderIcon = ({ className = "" }) => {
  return (
    <svg
      className={`folder-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* back part of folder */}
      <path d="M3 7c0-1.1.9-2 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

export default FolderIcon
