import React from "react";

const CommentsIcon = ({ className = "w-5 h-5 text-white" }) => {
  return (
    <svg
      className={`comments-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.2 95.2 56 129.2V480l96-52.5c28.1 7.5 57.7 11.5 88 11.5 141.4 0 256-93.1 256-208S397.4 32 256 32zm0 352c-30.9 0-61.1-5.1-88-14.6l-4.7-1.5-56.3 30.9 11.9-53.1-2.9-5.2C46.7 332.7 32 288.8 32 240 32 140.3 119.6 64 256 64s224 76.3 224 176-87.6 176-224 176z" />
    </svg>
  );
};

export default CommentsIcon;
