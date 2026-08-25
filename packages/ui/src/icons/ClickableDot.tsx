import React from "react";

const ClickableDot = ({
    size = 13,
    color = "#444",
    className = "",
}) => {
    const radius = size / 2;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle
                cx={radius}
                cy={radius}
                r={radius}
                fill={color}
            />
        </svg>
    );
};

export default ClickableDot;