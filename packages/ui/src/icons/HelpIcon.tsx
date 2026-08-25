import React from "react";

const HelpIcon = ({ className = "w-6.5 h-6.5" }) => {
  return (
    <svg
      className={`help-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.9 0-208-93.1-208-208S141.1 48 256 48s208 93.1 208 208-93.1 208-208 208zm0-336c-44.1 0-80 35.9-80 80h48c0-17.7 14.3-32 32-32s32 14.3 32 32c0 16.5-12.9 29.5-26.8 42.8C247.2 238.5 232 252 232 280v16h48v-8c0-9.6 6.7-16.2 19.2-28.3C314.4 246.8 336 225.2 336 208c0-44.1-35.9-80-80-80zm0 240a24 24 0 1 0 0 48 24 24 0 1 0 0-48z" />
    </svg>
  );
};

export default HelpIcon;
