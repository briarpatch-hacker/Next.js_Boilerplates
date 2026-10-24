import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const FullscreenOpen = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={{ ...style }}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14 14L21 21M21 21H15M21 21V15M10 10L3 3M3 3H9M3 3V9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default FullscreenOpen;
