import type { CSSProperties } from "react";
interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const Play = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      ...style,
    }}
    viewBox="0 0 92.2 122.88"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M92.2 60.97 0 122.88V0l92.2 60.97z"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
      }}
    />
  </svg>
);
export default Play;
