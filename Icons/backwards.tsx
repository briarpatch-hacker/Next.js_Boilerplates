import type { CSSProperties } from "react";
interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const Backwards = ({ className, style }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    imageRendering="optimizeQuality"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    viewBox="0 0 512 478.78"
    className={className}
    style={{ ...style }}
    aria-hidden="true"
  >
    <path d="M296.81 151.71 455.27 10.4c24.84-21.5 55.04-8.79 56.73 30.05v395.71c-1.02 39.29-32.69 53.89-59.87 32.97L296.81 330.66v105.5c-2.22 40.63-32.38 53.53-59.87 32.97L19.5 275.3c-26.35-23.5-25.65-44.41 0-68.21L240.08 10.4c24.85-19.99 55.61-7.36 56.73 30.05v111.26z" />
  </svg>
);
export default Backwards;
