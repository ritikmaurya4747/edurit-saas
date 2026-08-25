import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const ArrowUpIcon = ({
  color = 'currentColor',
  className = '',
  ...rest
}: IconProps) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      {...rest}
    >
      <path
        d='M12 19V5'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5 12L12 5L19 12'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export default ArrowUpIcon;