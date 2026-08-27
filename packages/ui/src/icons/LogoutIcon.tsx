import { SVGProps } from "react";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const LogoutIcon = ({
  color = 'currentColor',
  className = '',
  ...rest
}: IconProps) => {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d="m16 17 5-5-5-5"></path>
      <path d="M21 12H9"></path>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"> </path>
    </svg>
  );
};

export default LogoutIcon;