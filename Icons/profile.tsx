import type { CSSProperties } from "react";
interface IconProps {
  className?: string;
  style?: CSSProperties;
}

// Needs stroke style
const Profile = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 32 32"
    className={className}
    style={{
      stroke: "var(--grey-text)",
      ...style,
    }}
    aria-hidden="true"
  >
    <circle
      cx={16}
      cy={16}
      r={15}
      fill="none"
      strokeLinejoin="round"
      strokeMiterlimit={10}
    />
    <path d="M9 29a5 8.5 0 0 1 14 0" strokeWidth={0.5} fill="none" />
    <circle
      cx={16}
      cy={11.5}
      r={5.5}
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={0.5}
      fill="none"
    />
  </svg>
);
export default Profile;
