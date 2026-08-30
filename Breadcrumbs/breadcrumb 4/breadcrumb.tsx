"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./breadcrumb.module.css";

// Uses the pathname for the breadcrumb by default, but can override with custom menu
interface BreadcrumbMenuProps {
  linkOnLast: boolean;
  menu?: Breadcrumb[];
  style?: React.CSSProperties;
}

export type Breadcrumb = {
  title: string;
  href: string;
};

export default function BreadcrumbMenu({
  linkOnLast,
  menu,
  style,
}: BreadcrumbMenuProps) {
  const pathName = usePathname();
  const pathSegments = pathName.split("/").filter(Boolean);
  const items = menu || pathSegments;

  return (
    <div
      className={styles.breadcrumb}
      aria-label="breadcrumb"
      style={{ paddingBottom: `${0.4 * items.length + 0.4}rem`, ...style }}
    >
      {items.map((item, index) => {
        const title = menu
          ? (item as Breadcrumb).title
          : (item as string)
              .replaceAll("_", "-")
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
        const href = menu
          ? (item as Breadcrumb).href
          : `/${pathSegments.slice(0, index + 1).join("/")}`;
        const numLinks = items.length - 1;
        return index === numLinks && !linkOnLast ? (
          <div
            className={styles.segment}
            style={{ transform: `translateY(${0.4 * index}rem)` }}
            key={index}
            aria-current="page"
          >
            {title}
          </div>
        ) : (
          <div
            className={styles.segment}
            style={{ transform: `translateY(${0.4 * index}rem)` }}
            key={index}
          >
            <Link href={href}>{title}</Link>
            {index !== numLinks && <div className={styles.dash}>{`➥`}</div>}
          </div>
        );
      })}
    </div>
  );
}
