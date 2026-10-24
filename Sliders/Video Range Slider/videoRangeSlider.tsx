"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./videoRangeSlider.module.css";
import classNames from "classnames";

// Converts videoDuration to a timecode in HH:MM:SS
export function convertToTimecode(videoDuration: number) {
  let seconds = (videoDuration % 60).toString();
  let minutes = (Math.floor(videoDuration / 60) % 60).toString();
  while (seconds.length < 2) {
    seconds = `0` + seconds;
  }
  while (minutes.toString().length < 2) {
    minutes = `0` + minutes;
  }
  let timecode = `${minutes}:${seconds}`;
  if (videoDuration >= 3600) {
    let hours = Math.floor(videoDuration / 3600).toString();
    timecode = `${hours}:${timecode}`;
  }
  return timecode;
}

// Converts seconds to a spoken form for screen readers (e.g. "1 hour 2 minutes 5 seconds")
function convertToSpokenTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  if (seconds || !parts.length) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }
  return parts.join(" ");
}

// Converts a raw digit buffer (grouped from the right) into total seconds,
// letting over-60 minute/second chunks roll over (e.g. "13:99" -> 879s).
function digitsToSeconds(digits: string): number {
  const d = digits.replace(/\D/g, "");
  if (!d) return 0;
  const ss = parseInt(d.slice(-2), 10) || 0;
  const mm = parseInt(d.slice(-4, -2) || "0", 10) || 0;
  const hh = parseInt(d.slice(0, -4) || "0", 10) || 0;
  return hh * 3600 + mm * 60 + ss;
}

// Parses a typed time into total seconds. When colons are present, the segments
// are read right-to-left as seconds, minutes, hours ("3:4" -> 3:04,
// "1:3:4" -> 1:03:04); any extra leading segments are ignored. Without colons,
// the digits are grouped from the right ("128" -> 1:28).
function parseTime(input: string): number {
  if (input.includes(":")) {
    const nums = input.split(":").map((p) => parseInt(p, 10) || 0);
    const ss = nums[nums.length - 1] || 0;
    const mm = nums[nums.length - 2] || 0;
    const hh = nums[nums.length - 3] || 0;
    return hh * 3600 + mm * 60 + ss;
  }
  return digitsToSeconds(input);
}

// Two-thumb slider for picking a start/end window (in seconds) within a video.
// Usage:
//   <VideoRangeSlider
//     videoDuration={duration}
//     startTime={start}
//     endTime={end}
//     currentTime={playhead}
//     onTimeframeChange={(s, e) => setRange([s, e])}
//     ariaLabel="Video range"
//   />
interface VideoRangeSliderProps {
  videoDuration: number;
  onTimeframeChange: (start: number, end: number) => void;
  ariaLabel: string;
  startTime?: number;
  endTime?: number;
  // Shows a playhead marker at this time when provided
  currentTime?: number;
  style?: React.CSSProperties;
}

export default function VideoRangeSlider({
  videoDuration,
  onTimeframeChange,
  ariaLabel,
  startTime,
  endTime,
  currentTime,
  style,
}: VideoRangeSliderProps) {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(videoDuration);
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
  const [showIndicator, setShowIndicator] = useState(true);
  const [editingThumb, setEditingThumb] = useState<"start" | "end" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevCurrentTimeRef = useRef(0);
  const indicatorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // When the timeframe changes, changes the fill and calls a parent function
  useEffect(() => {
    setFillStart((100 * start) / videoDuration);
    setFillWidth((100 * (end - start)) / videoDuration);
  }, [start, end]);

  // When the prop timeframe changes, sets the new start / end times
  useEffect(() => {
    setStart(startTime ?? 0);
    setEnd(endTime ?? videoDuration);
  }, [startTime, endTime, videoDuration]);

  // When the currentTime prop changes, records it and adjusts the indicator's transition if needed
  useEffect(() => {
    if (typeof currentTime !== "number") return;
    if (
      currentTime < prevCurrentTimeRef.current ||
      currentTime - prevCurrentTimeRef.current > 2
    ) {
      clearTimeout(indicatorTimeoutRef.current);
      if (showIndicator) {
        setShowIndicator(false);
        indicatorTimeoutRef.current = setTimeout(
          () => {
            setShowIndicator(true);
            indicatorTimeoutRef.current = undefined;
          },
          currentTime == 0 ? 400 : 20,
        );
      }
    }
    prevCurrentTimeRef.current = currentTime;
  }, [currentTime]);

  // Handles dragging the start thumb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const newPoint = Math.round(
        videoDuration *
          Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      );
      if (activeThumb.current === "start") {
        const newStart = newPoint < end ? newPoint : end - 1;
        setStart(newStart);
        onTimeframeChange(newStart, end);
      } else {
        const newEnd = newPoint > start ? newPoint : start + 1;
        setEnd(newEnd);
        onTimeframeChange(start, newEnd);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !trackRef.current) return;
      e.preventDefault();
      const rect = trackRef.current.getBoundingClientRect();
      const newPoint = Math.round(
        videoDuration *
          Math.max(
            0,
            Math.min(1, (e.touches[0].clientX - rect.left) / rect.width),
          ),
      );
      if (activeThumb.current === "start") {
        const newStart = newPoint < end ? newPoint : end - 1;
        setStart(newStart);
        onTimeframeChange(newStart, end);
      } else {
        const newEnd = newPoint > start ? newPoint : start + 1;
        setEnd(newEnd);
        onTimeframeChange(start, newEnd);
      }
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
  }, [isDragging]);

  // Moves the start thumb when user presses on arrow keys
  function handleKeydownStart(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      startEditing("start");
    } else if (e.key === "ArrowRight") {
      if (start + 1 < end) {
        setStart(start + 1);
        onTimeframeChange(start + 1, end);
      }
    } else if (e.key === "ArrowLeft") {
      if (start - 1 >= 0) {
        setStart(start - 1);
        onTimeframeChange(start - 1, end);
      }
    }
  }

  // Moves the end thumb when user presses on arrow keys
  function handleKeydownEnd(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      startEditing("end");
    } else if (e.key === "ArrowRight") {
      if (end + 1 <= videoDuration) {
        setEnd(end + 1);
        onTimeframeChange(start, end + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (end - 1 > start) {
        setEnd(end - 1);
        onTimeframeChange(start, end - 1);
      }
    }
  }

  // Moves the closest thumb when user clicks or touches on the track
  function handleDragStart(clientX: number, track: HTMLElement) {
    if (isDragging) return;
    const rect = track.getBoundingClientRect();
    const newPoint = Math.round(
      videoDuration *
        Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
    );
    let thumb: "start" | "end" = "start";
    if (newPoint < start) {
    } else if (newPoint > end) {
      thumb = "end";
    } else {
      thumb =
        Math.abs(start - newPoint) > Math.abs(end - newPoint) ? "end" : "start";
    }
    activeThumb.current = thumb;
    if (thumb === "start") {
      setStart(newPoint);
      onTimeframeChange(newPoint, end);
      setTimeout(() => {
        startThumbRef.current?.focus();
      }, 0);
    } else {
      setEnd(newPoint);
      onTimeframeChange(start, newPoint);
      setTimeout(() => {
        endThumbRef.current?.focus();
      }, 0);
    }
    setIsDragging(true);
  }

  // Moves the closet thumb when user presses down on the track
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

  // Max digits a user can type, based on whether the video reaches an hour
  const maxDigits = videoDuration >= 3600 ? 6 : 4;

  // Clamps a time to the valid range for the given thumb (start < end)
  function clampTime(thumb: "start" | "end", seconds: number) {
    return thumb === "start"
      ? Math.max(0, Math.min(seconds, end - 1))
      : Math.min(videoDuration, Math.max(seconds, start + 1));
  }

  // Opens the editor for a thumb, seeding the input with its current time
  function startEditing(thumb: "start" | "end") {
    skipCommitRef.current = false;
    const current = thumb === "start" ? start : end;
    setEditValue(convertToTimecode(current));
    setEditingThumb(thumb);
  }

  // Commits the typed time, snapping it into the valid range
  function commitEdit(thumb: "start" | "end") {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
    } else if (editValue.replace(/\D/g, "")) {
      const seconds = clampTime(thumb, parseTime(editValue));
      if (thumb === "start") {
        setStart(seconds);
        onTimeframeChange(seconds, end);
      } else {
        setEnd(seconds);
        onTimeframeChange(start, seconds);
      }
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

  // Steps the edited time by one second and keeps the input in sync
  function stepEdit(thumb: "start" | "end", direction: 1 | -1) {
    const base = editValue
      ? parseTime(editValue)
      : thumb === "start"
        ? start
        : end;
    const next = clampTime(thumb, base + direction);
    if (thumb === "start") {
      setStart(next);
      onTimeframeChange(next, end);
    } else {
      setEnd(next);
      onTimeframeChange(start, next);
    }
    setEditValue(convertToTimecode(next));
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
    // Moves the active thumb to a pointer position, clamped past the other thumb
    function moveTo(moveX: number) {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const newPoint = Math.round(
        videoDuration *
          Math.max(0, Math.min(1, (moveX - rect.left) / rect.width)),
      );
      if (thumb === "start") {
        const newStart = newPoint < end ? newPoint : end - 1;
        setStart(newStart);
        onTimeframeChange(newStart, end);
      } else {
        const newEnd = newPoint > start ? newPoint : start + 1;
        setEnd(newEnd);
        onTimeframeChange(start, newEnd);
      }
    }
    function onMove(moveX: number, moveY: number) {
      if (started) {
        moveTo(moveX);
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
        moveTo(moveX);
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

  // Renders a thumb's label as either the editable input or the timecode text
  function renderThumbLabel(thumb: "start" | "end") {
    if (editingThumb === thumb) {
      return (
        <input
          className={styles.thumb_input}
          size={editValue.length || 1}
          value={editValue}
          inputMode="numeric"
          maxLength={maxDigits + 2}
          autoFocus
          aria-label={ariaLabel}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setEditValue(e.target.value.replace(/[^\d:]/g, ""))}
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
        onMouseDown={(e) => {
          e.stopPropagation();
          handleLabelPointerDown(thumb, e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleLabelPointerDown(
            thumb,
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
        }}
      >
        {convertToTimecode(thumb === "start" ? start : end)}
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
        aria-keyshortcuts="Enter"
        onKeyDown={handleKeydownStart}
        aria-valuemin={0}
        aria-valuemax={end - 1}
        aria-valuenow={start}
        aria-valuetext={convertToSpokenTime(start)}
        ref={startThumbRef}
      >
        <div
          className={styles.thumb_label}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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
        aria-valuemin={start + 1}
        aria-valuemax={videoDuration}
        aria-valuenow={end}
        aria-valuetext={convertToSpokenTime(end)}
        aria-label={ariaLabel}
        aria-keyshortcuts="Enter"
        onKeyDown={handleKeydownEnd}
        ref={endThumbRef}
      >
        <div
          className={styles.thumb_label}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {renderThumbLabel("end")}
        </div>
      </div>
      {typeof currentTime === "number" && videoDuration && (
        <div
          className={classNames(styles.indicator, {
            [styles.hidden]: !showIndicator,
          })}
          style={{ left: `${(100 * currentTime) / videoDuration}%` }}
        ></div>
      )}
    </div>
  );
}
