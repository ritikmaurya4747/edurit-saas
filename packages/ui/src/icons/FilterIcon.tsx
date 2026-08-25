import * as React from "react";

const FilterIcon = ({ className = "w-4 h-4 text-gray-100" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <path d="M487.976 0H24.024C10.766 0 .033 10.733.033 23.991c0 4.25 1.168 8.4 3.369 12.007l190.665 298.19v151.823c0 13.255 10.745 24 24 24 4.221 0 8.385-1.113 12.054-3.229l64-36.992A23.997 23.997 0 0 0 304.033 448V334.188l190.598-298.19A23.991 23.991 0 0 0 487.976 0zM288.033 317.812V440l-48 27.727V317.812L54.753 32h402.559L288.033 317.812z"/>
  </svg>
);

export default FilterIcon;
