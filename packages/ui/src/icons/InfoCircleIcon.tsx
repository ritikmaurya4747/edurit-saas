import React, { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const InfoCircleIcon = ({
  color = "currentColor",
  className = "",
  ...rest
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800px"
      height="800px"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...rest}
    >
      <path
        fill={color}
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 14a1 1 0 0 0 1-1v-3a1 1 0 1 0-2 0v3a1 1 0 0 0 1 1zm1-7a1 1 0 1 1-2 0 1 1 0 1 1 2 0z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default InfoCircleIcon;
