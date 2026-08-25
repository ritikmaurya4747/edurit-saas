import React from 'react';
import { IconProps } from './types';

const CloseIcon = ({
  color = 'currentColor',
  className = 'w-4 h-4 cursor-pointer',
  ...rest
}: IconProps) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 50 50'
      width='50px'
      height='50px'
      className={className}
      {...rest}
      fill='none'
      stroke={color}
      strokeWidth='8'
      strokeLinecap='round'
    >
      <line x1='10' y1='10' x2='40' y2='40' />
      <line x1='40' y1='10' x2='10' y2='40' />
    </svg>
  );
};

export default CloseIcon;