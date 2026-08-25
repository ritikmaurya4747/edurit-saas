 const PocketIcon  = ({ 
  size = 28, 
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
      {/* Top lock/zip section - rounded */}
      <path d="M6 4c0-1 1-2 2-2h8c1 0 2 1 2 2v3H6V4z" />
      
      {/* Vertical line separating lock and pocket */}
      <line x1="6" y1="7" x2="18" y2="7" />
      
      {/* Horizontal line in lock section */}
      <line x1="12" y1="4" x2="12" y2="7" />
      
      {/* Main pocket body */}
      <path d="M4 7v10c0 1.5 1 2 2 2h12c1 0 2-0.5 2-2V7M6 9h12M6 12h12" />
      
      {/* Rounded bottom */}
      <path d="M6 15c0 2 1 3 6 3s6-1 6-3" />
    </svg>
  );
};

export default PocketIcon 