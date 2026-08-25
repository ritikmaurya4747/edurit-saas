const ShoppingBagIcon = ({ 
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
      {/* First slider/control line */}
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="18" cy="6" r="2" />
      
      {/* Second slider/control line */}
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="6" cy="12" r="2" />
      
      {/* Third slider/control line */}
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  );
};
export default ShoppingBagIcon