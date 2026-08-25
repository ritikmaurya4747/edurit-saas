import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const ArrowDownIcon = ({
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
        d='M12 5V19'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M19 12L12 19L5 12'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export default ArrowDownIcon;