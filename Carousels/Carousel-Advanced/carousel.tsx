"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./carousel.module.css";

/*
 * children - the content that will be on the carousel
 * width - the width of the carousel
 * columnGap - the gap between each child
 * scrollValue - the number of pixels the carousel will scroll by when you hit the arrows
 * label - optional label displayed in the controls header
 * style - any additional styles for the component
 */
interface CarouselProps {
  children: React.ReactNode;
  width: string;
  columnGap: string;
  scrollValue: number;
  label?: string;
  style?: {};
}

const arrow = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.06">
    <path d="M58.94 24.28a14.27 14.27 0 0 1 20.35-20l39.49 40.16a14.28 14.28 0 0 1 0 20l-38.69 39.35a14.27 14.27 0 1 1-20.35-20l15.08-15.38-60.67-.29a14.27 14.27 0 0 1 .24-28.54l59.85.28-15.3-15.58Z" />
  </svg>
);

export default function Carousel({
  children,
  width,
  columnGap,
  style,
  scrollValue,
  label,
}: CarouselProps) {
  const carouselRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        carousel.scrollLeft += e.deltaX;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    };

    carousel.addEventListener("wheel", handleWheel, { passive: false });
    carousel.addEventListener("touchstart", handleTouchStart, { passive: true });
    carousel.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      carousel.removeEventListener("wheel", handleWheel);
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  function scrollForward() {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({
      left: Math.min(
        carousel.scrollLeft + scrollValue,
        carousel.scrollWidth - carousel.clientWidth
      ),
      behavior: "smooth",
    });
  }

  function scrollBackward() {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({
      left: Math.max(carousel.scrollLeft - scrollValue, 0),
      behavior: "smooth",
    });
  }

  return (
    <div className={styles.carousel_container}>
      <div className={styles.carousel_controls}>
        {label && <span className={styles.carousel_label}>{label}</span>}
        <div className={styles.carousel_buttons}>
          <button
            onClick={scrollBackward}
            className={styles.back}
            aria-label="Scroll backward"
          >
            {arrow}
          </button>
          <button
            onClick={scrollForward}
            className={styles.forward}
            aria-label="Scroll forward"
          >
            {arrow}
          </button>
        </div>
      </div>
      <div
        ref={carouselRef}
        className={styles.carousel}
        style={{
          width: width,
          maxWidth: width,
          columnGap: columnGap,
          ...style,
        }}
        role="region"
        aria-label="Carousel"
      >
        {children}
      </div>
    </div>
  );
}
