import { SVGProps } from "react";
import { cn } from "../utils/cn";

type IconProps = Partial<SVGProps<SVGSVGElement>>;

const Spinner = ({ className = "", ...rest }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6 text-white", className)}
      viewBox="0 0 50 50"
      {...rest}
    >
      <circle
        cx="25"
        cy="25"
        r="18"            
        stroke="currentColor"
        strokeWidth="4"   
        fill="none"
        opacity="0.25"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="40 200"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          repeatCount="indefinite"
          dur="1s"
          values="0 25 25;360 25 25"
        />
      </circle>
    </svg>
  );
};

export default Spinner;
