import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const ArrowUpArrowDown = ({
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
      <path d="M8 11L11 11L11 0H13L13 11H16V12L12 16L8 12V11Z" fill={color} />
    </svg>
  );
};

export default ArrowUpArrowDown;
