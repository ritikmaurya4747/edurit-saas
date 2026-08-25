
const HomeIcon = ({
    size = 24,
    className = ''
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Roof */}
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />

            {/* Door/Window */}
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
};
export default HomeIcon