const WalkingUserIcon = ({ size = 24, className = '' }) => {
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
      {/* Head */}
      <circle cx="12" cy="4" r="2" />

      {/* Body */}
      <path d="M12 6.5v4" />

      {/* Left Arm */}
      <path d="M12 8.5l-3 2.5" />

      {/* Right Arm */}
      <path d="M12 8.5l3 1.5" />

      {/* Left Leg (forward) */}
      <path d="M12 10.5l-3 6" />

      {/* Right Leg (backward) */}
      <path d="M12 10.5l3 4.5" />
    </svg>
  );
};

export default WalkingUserIcon;
