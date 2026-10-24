import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const CloseX = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 122.878 122.88"
    className={className}
    style={{ ...style }}
    aria-hidden="true"
  >
    <path d="M1.426 8.313a4.87 4.87 0 0 1 6.886-6.886l53.127 53.127 53.127-53.127a4.87 4.87 0 1 1 6.887 6.886L68.324 61.439l53.128 53.128a4.87 4.87 0 0 1-6.887 6.886L61.438 68.326 8.312 121.453a4.868 4.868 0 1 1-6.886-6.886l53.127-53.128L1.426 8.313z" />
  </svg>
);

export default CloseX;
