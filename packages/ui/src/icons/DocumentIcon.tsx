import React from 'react';

 const DocumentIcon = ({ 
  size = 24, 
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document background */}
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      
      {/* Corner fold */}
      <polyline points="13 2 13 9 20 9" />
      
      {/* Lines inside document */}
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1" />
      <line x1="9" y1="11" x2="15" y2="11" strokeWidth="1" />
    </svg>
  );
};
export default DocumentIcon
