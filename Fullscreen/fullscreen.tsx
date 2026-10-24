"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./fullscreen.module.css";
import classNames from "classnames";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

/* A generic fullscreen wrapper. It doesn't care what the content is
 * (video player, photo gallery, canvas, etc.), it only handles:
 *  - entering / exiting fullscreen
 *  - hiding the controls (and the cursor) after the mouse goes idle
 *  - exposing the fullscreen state to the content and controls
 *
 * Requires: npm install react-full-screen classnames
 *
 * children - the content to display. Either nodes, or a function that receives the fullscreen state
 * controls - an optional bar shown below the content. Either nodes, or a function that receives the fullscreen state
 * hideControlsAfter - ms of mouse inactivity before the controls hide while in fullscreen. 0 disables hiding
 * onChange - called whenever fullscreen is entered or exited
 * className - adds a class to the outermost element
 * style - adds any additional styling to the outermost element
 * contentStyle - adds any additional styling to the content area
 */
export interface FullscreenState {
  active: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => void;
  controlsVisible: boolean;
}

type Slot = React.ReactNode | ((state: FullscreenState) => React.ReactNode);

interface FullscreenProps {
  children: Slot;
  controls?: Slot;
  hideControlsAfter?: number;
  onChange?: (active: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export default function Fullscreen({
  children,
  controls,
  hideControlsAfter = 3000,
  onChange,
  className,
  style,
  contentStyle,
}: FullscreenProps) {
  const handle = useFullScreenHandle();
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (hideControlsAfter > 0) {
      idleTimeoutRef.current = setTimeout(
        () => setControlsVisible(false),
        hideControlsAfter,
      );
    }
  }, [hideControlsAfter, clearIdleTimer]);

  //Shows the controls and restarts the idle timer whenever the mouse moves
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    startIdleTimer();
  }, [startIdleTimer]);

  //Starts the idle timer when entering fullscreen, and resets everything when exiting
  useEffect(() => {
    if (handle.active) {
      startIdleTimer();
    } else {
      clearIdleTimer();
      setControlsVisible(true);
    }
    return clearIdleTimer;
  }, [handle.active, startIdleTimer, clearIdleTimer]);

  const toggle = useCallback(() => {
    if (handle.active) {
      handle.exit();
    } else {
      handle.enter();
    }
  }, [handle]);

  const state: FullscreenState = {
    active: handle.active,
    enter: handle.enter,
    exit: handle.exit,
    toggle,
    controlsVisible,
  };
  const controlsHidden = handle.active && !controlsVisible;

  const render = (slot: Slot) =>
    typeof slot === "function" ? slot(state) : slot;

  return (
    <div
      className={classNames(styles.fullscreen_wrapper, className, {
        [styles.active]: handle.active,
      })}
      style={style}
    >
      <FullScreen
        handle={handle}
        onChange={(active) => onChange?.(active)}
        className={styles.fullscreen_root}
      >
        <div
          className={styles.container}
          onMouseMove={handle.active ? handleMouseMove : undefined}
        >
          {/* Sits on top of everything while idle so the cursor can be hidden */}
          {controlsHidden && <div className={styles.idle_overlay} />}
          <div className={styles.content} style={contentStyle}>
            {render(children)}
          </div>
          {controls && (
            <div
              className={classNames(styles.controls, {
                [styles.controls_hidden]: controlsHidden,
              })}
            >
              {render(controls)}
            </div>
          )}
        </div>
      </FullScreen>
    </div>
  );
}
