const TrendingUpIcon = ({ 
  size = 24, 
  className = ''
}) => {
  return (
     <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      viewBox="0 0 24 24"
    >
      {/* Bar Chart - Three bars */}
      <rect x="3" y="12" width="3" height="8" />
      <rect x="10" y="8" width="3" height="12" />
      <rect x="17" y="5" width="3" height="15" />
      
      {/* Trending Line - on top */}
      <polyline points="3 8 10 4 17 2" strokeWidth="2" />
      
      {/* Bottom line */}
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  );
};

export default TrendingUpIcon