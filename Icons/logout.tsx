import type { CSSProperties } from "react";
interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const Logout = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 32 32"
    className={className}
    style={{
      ...style,
    }}
    aria-hidden="true"
  >
    <path d="M6 30h12a2.002 2.002 0 0 0 2-2v-3h-2v3H6V4h12v3h2V4a2.002 2.002 0 0 0-2-2H6a2.002 2.002 0 0 0-2 2v24a2.002 2.002 0 0 0 2 2Z" />
    <path d="M20.586 20.586 24.172 17H10v-2h14.172l-3.586-3.586L22 10l6 6-6 6-1.414-1.414z" />
    <path
      d="M0 0h32v32H0z"
      data-name="&lt;Transparent Rectangle&gt;"
      style={{
        fill: "none",
      }}
    />
  </svg>
);

export default Logout;
