import type { CSSProperties } from "react";

interface IconProps {
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const BookmarkIcon = ({ filled = false, className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    style={{ ...style }}
    aria-hidden="true"
  >
    {filled ? (
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    ) : (
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm.5 15.73-5.5-2.36-5.5 2.36V4.5h11v14.23z" />
    )}
  </svg>
);

export default BookmarkIcon;
