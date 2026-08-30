import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const DashboardIcon = ({
  color = 'currentColor',
  className = '',
  ...rest
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      color={color}
      {...rest}
    >
      <rect width="7" height="9" x="3" y="3" rx="1"></rect>
      <rect width="7" height="5" x="14" y="3" rx="1"></rect>
      <rect width="7" height="9" x="14" y="12" rx="1"></rect>
      <rect width="7" height="5" x="3" y="16" rx="1"></rect>
    </svg>
  );
};

export default DashboardIcon;