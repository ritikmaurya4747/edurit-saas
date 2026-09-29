import React from "react";

interface BurgerMenuLeftProps {
  className?: string;
  stroke?: string;
}
const BurgerMenuLeft = ({ className, stroke }: BurgerMenuLeftProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="#000000"
      className={className}
    >
      <path
        d="M4 18H10"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M4 12L16 12"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M4 6L20 6"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BurgerMenuLeft;
