import React from 'react';

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;       
  color?: string;      
  strokeWidth?: number; 
  className?: string;   
}

const CheckIcon: React.FC<CheckIconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 3,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke={color}
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
};

export default CheckIcon;
