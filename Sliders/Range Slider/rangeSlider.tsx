"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./rangeSlider.module.css";
import classNames from "classnames";

// Two-thumb slider for picking a start/end within min..max
// Usage:
//   <RangeSlider min={0} max={100} onRangeChange={(s, e) => ...} ariaLabel="Price" editable />
//   Labeled steps:
//   <RangeSlider min={0} max={2} formatValue={(i) => ["Low", "Medium", "High"][i]} ... />
interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  onRangeChange: (start: number, end: number) => void;
  ariaLabel: string;
  // Controlled sync from the parent
  startValue?: number;
  endValue?: number;
  // Lets the user click a label and type a value
  editable?: boolean;
  // How a value is shown in the labels and read by screen readers
  formatValue?: (value: number) => string;
  style?: React.CSSProperties;
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  onRangeChange,
  ariaLabel,
  startValue,
  endValue,
  editable,
  formatValue = String,
  style,
}: RangeSliderProps) {
  const [start, setStart] = useState(min);
  const [end, setEnd] = useState(max);
  const [fillWidth, setFillWidth] = useState(100);
  const [fillStart, setFillStart] = useState(0);

  const startThumbRef = useRef<null | HTMLDivElement>(null);
  const endThumbRef = useRef<null | HTMLDivElement>(null);
  const activeThumb = useRef<"start" | "end" | null>(null);
  const trackRef = useRef<null | HTMLDivElement>(null);
  // When a track press ends an edit, skip the blur-commit so the click-move wins
  const skipCommitRef = useRef(false);
  // After committing/canceling via keyboard, focus this thumb to keep flow going
  const shouldFocusThumbRef = useRef<"start" | "end" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTransition, setShowTransition] = useState(true);
  const [editingThumb, setEditingThumb] = useState<"start" | "end" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Decimal places in step, so snapped values don't pick up float noise
  const decimals = (String(step).split(".")[1] ?? "").length;

  // Rounds a value to the nearest step from min
  function snap(value: number) {
    return parseFloat(
      (min + Math.round((value - min) / step) * step).toFixed(decimals),
    );
  }

  // Clamps a value to the valid range for the given thumb (start < end)
  function clampValue(thumb: "start" | "end", value: number) {
    return thumb === "start"
      ? Math.max(min, Math.min(value, end - step))
      : Math.min(max, Math.max(value, start + step));
  }

  // Converts a pointer x position to a snapped value on the track
  function valueFromPointer(clientX: number, track: HTMLElement) {
    const rect = track.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );
    return snap(min + (max - min) * percentage);
  }

  // Moves a thumb to a value, clamped past the other thumb
  function moveThumb(thumb: "start" | "end", value: number) {
    if (thumb === "start") {
      const newStart = clampValue("start", value);
      setStart(newStart);
      onRangeChange(newStart, end);
    } else {
      const newEnd = clampValue("end", value);
      setEnd(newEnd);
      onRangeChange(start, newEnd);
    }
  }

  // When the range changes, changes the fill
  useEffect(() => {
    setFillStart((100 * (start - min)) / (max - min));
    setFillWidth((100 * (end - start)) / (max - min));
  }, [start, end]);

  // When the prop range changes, sets the new start / end values
  useEffect(() => {
    setStart(startValue ?? min);
    setEnd(endValue ?? max);
  }, [startValue, endValue, min, max]);

  // Handles dragging the active thumb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current || !activeThumb.current) return;
      moveThumb(
        activeThumb.current,
        valueFromPointer(e.clientX, trackRef.current),
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !trackRef.current || !activeThumb.current) return;
      e.preventDefault();
      moveThumb(
        activeThumb.current,
        valueFromPointer(e.touches[0].clientX, trackRef.current),
      );
    };

    const handleMouseUp = () => {
      setShowTransition(true);
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setShowTransition(true);
      setIsDragging(false);
    };

    if (isDragging) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowTransition(false);
      }, 200);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, start, end]);

  // Moves a thumb when user presses on arrow keys
  function handleKeydown(thumb: "start" | "end", e: React.KeyboardEvent) {
    const current = thumb === "start" ? start : end;
    if (e.key === "Enter") {
      if (editable) {
        e.preventDefault();
        startEditing(thumb);
      }
    } else if (e.key === "ArrowRight") {
      moveThumb(thumb, snap(current + step));
    } else if (e.key === "ArrowLeft") {
      moveThumb(thumb, snap(current - step));
    }
  }

  // Moves the closest thumb when user clicks or touches on the track
  function handleDragStart(clientX: number, track: HTMLElement) {
    if (isDragging) return;
    const newPoint = valueFromPointer(clientX, track);
    let thumb: "start" | "end" = "start";
    if (newPoint > end) {
      thumb = "end";
    } else if (newPoint >= start) {
      thumb =
        Math.abs(start - newPoint) > Math.abs(end - newPoint) ? "end" : "start";
    }
    activeThumb.current = thumb;
    moveThumb(thumb, newPoint);
    setTimeout(() => {
      (thumb === "start" ? startThumbRef : endThumbRef).current?.focus();
    }, 0);
    setIsDragging(true);
  }

  // Moves the closest thumb when user presses down on the track
  function handleMouseDown(e: React.MouseEvent) {
    skipCommitRef.current = true;
    handleDragStart(e.clientX, e.currentTarget as HTMLElement);
  }

  // Moves the closest thumb when user touches the track
  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    skipCommitRef.current = true;
    handleDragStart(e.touches[0].clientX, e.currentTarget as HTMLElement);
  }

  // Strips a formatted value down to its number ("$50" -> "50") for the input
  function toEditValue(value: string) {
    return value.replace(/[^\d.-]/g, "");
  }

  // Opens the editor for a thumb, seeding the input with its current value
  function startEditing(thumb: "start" | "end") {
    skipCommitRef.current = false;
    setEditValue(toEditValue(formatValue(thumb === "start" ? start : end)));
    setEditingThumb(thumb);
  }

  // Commits the typed value, snapping it into the valid range
  function commitEdit(thumb: "start" | "end") {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
    } else {
      const parsed = parseFloat(editValue);
      if (!Number.isNaN(parsed)) moveThumb(thumb, snap(parsed));
    }
    setEditingThumb(null);
    if (shouldFocusThumbRef.current) {
      const target = shouldFocusThumbRef.current;
      shouldFocusThumbRef.current = null;
      setTimeout(() => {
        (target === "start" ? startThumbRef : endThumbRef).current?.focus();
      }, 0);
    }
  }

  // Steps the edited value and keeps the input in sync
  function stepEdit(thumb: "start" | "end", direction: 1 | -1) {
    const parsed = parseFloat(editValue);
    const base = Number.isNaN(parsed) ? (thumb === "start" ? start : end) : parsed;
    const next = clampValue(thumb, snap(base + direction * step));
    moveThumb(thumb, next);
    setEditValue(toEditValue(formatValue(next)));
  }

  // On a thumb label: a clean click opens the editor; a drag past a small
  // threshold moves the thumb. The whole drag is handled here (rather than
  // handing off to the drag effect) so it engages without lag, and the
  // threshold gate stops tiny click jitter from nudging the thumb. The thumb
  // is only focused once a drag actually starts, so a click doesn't flash its
  // focus outline.
  function handleLabelPointerDown(
    thumb: "start" | "end",
    clientX: number,
    clientY: number,
  ) {
    const DRAG_THRESHOLD = 4;
    let started = false;

    function cleanup() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    }
    function onMove(moveX: number, moveY: number) {
      if (!trackRef.current) return;
      if (started) {
        moveThumb(thumb, valueFromPointer(moveX, trackRef.current));
        return;
      }
      if (
        Math.abs(moveX - clientX) > DRAG_THRESHOLD ||
        Math.abs(moveY - clientY) > DRAG_THRESHOLD
      ) {
        started = true;
        activeThumb.current = thumb;
        (thumb === "start" ? startThumbRef : endThumbRef).current?.focus();
        setShowTransition(false);
        moveThumb(thumb, valueFromPointer(moveX, trackRef.current));
      }
    }
    function onMouseMove(e: MouseEvent) {
      onMove(e.clientX, e.clientY);
    }
    function onMouseUp() {
      cleanup();
      if (started) {
        setShowTransition(true);
      } else {
        startEditing(thumb);
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (started) e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
    function onTouchEnd() {
      cleanup();
      if (started) {
        setShowTransition(true);
      } else {
        startEditing(thumb);
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }

  // Renders a thumb's label as either the editable input or the formatted value
  function renderThumbLabel(thumb: "start" | "end") {
    if (editable && editingThumb === thumb) {
      return (
        <input
          className={styles.thumb_input}
          size={editValue.length || 1}
          value={editValue}
          inputMode="decimal"
          autoFocus
          aria-label={ariaLabel}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setEditValue(toEditValue(e.target.value))}
          onBlur={() => commitEdit(thumb)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              shouldFocusThumbRef.current = thumb;
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              skipCommitRef.current = true;
              shouldFocusThumbRef.current = thumb;
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              stepEdit(thumb, 1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              stepEdit(thumb, -1);
            }
          }}
        />
      );
    }
    return (
      <div
        className={styles.text_wrapper}
        onMouseDown={
          editable
            ? (e) => {
                e.stopPropagation();
                handleLabelPointerDown(thumb, e.clientX, e.clientY);
              }
            : undefined
        }
        onTouchStart={
          editable
            ? (e) => {
                e.stopPropagation();
                handleLabelPointerDown(
                  thumb,
                  e.touches[0].clientX,
                  e.touches[0].clientY,
                );
              }
            : undefined
        }
      >
        {formatValue(thumb === "start" ? start : end)}
      </div>
    );
  }

  return (
    <div
      style={{ ...style }}
      className={styles.track}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      ref={trackRef}
    >
      <div
        className={classNames(styles.fill, {
          [styles.transition]: showTransition,
        })}
        style={{ width: `${fillWidth}%`, left: `${fillStart}%` }}
      ></div>
      <div
        className={classNames(styles.thumb, styles.start, {
          [styles.transition]: showTransition,
        })}
        style={{ left: `${fillStart}%` }}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-keyshortcuts={editable ? "Enter" : undefined}
        onKeyDown={(e) => handleKeydown("start", e)}
        aria-valuemin={min}
        aria-valuemax={end - step}
        aria-valuenow={start}
        aria-valuetext={formatValue(start)}
        ref={startThumbRef}
      >
        <div
          className={styles.thumb_label}
          onMouseDown={editable ? (e) => e.stopPropagation() : undefined}
          onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
        >
          {renderThumbLabel("start")}
        </div>
      </div>
      <div
        className={classNames(styles.thumb, styles.end, {
          [styles.transition]: showTransition,
        })}
        style={{ left: `${fillStart + fillWidth}%` }}
        role="slider"
        tabIndex={0}
        aria-valuemin={start + step}
        aria-valuemax={max}
        aria-valuenow={end}
        aria-valuetext={formatValue(end)}
        aria-label={ariaLabel}
        aria-keyshortcuts={editable ? "Enter" : undefined}
        onKeyDown={(e) => handleKeydown("end", e)}
        ref={endThumbRef}
      >
        <div
          className={styles.thumb_label}
          onMouseDown={editable ? (e) => e.stopPropagation() : undefined}
          onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
        >
          {renderThumbLabel("end")}
        </div>
      </div>
    </div>
  );
}
