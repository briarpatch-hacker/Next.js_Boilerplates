import type { CSSProperties } from "react";
interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const Pause = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      ...style,
    }}
    viewBox="0 0 87.72 122.88"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M0 0h35.54v122.88H0V0zm52.18 0h35.54v122.88H52.18V0z"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
      }}
    />
  </svg>
);
export default Pause;
