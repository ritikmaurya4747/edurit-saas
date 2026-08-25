import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const ArrowUpWide = ({
  color = "currentColor",
  className = "",
  ...rest
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800px"
      height="800px"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      {...rest}
    >
      <path d="M0 5H3L3 16H5L5 5L8 5V4L4 0L0 4V5Z" fill={color} />
      <path d="M16 6H10V8H16V6Z" fill={color} />
      <path d="M10 10H14V12H10V10Z" fill={color} />
      <path d="M12 14H10V16H12V14Z" fill={color} />
    </svg>
  );
};

export default ArrowUpWide;
