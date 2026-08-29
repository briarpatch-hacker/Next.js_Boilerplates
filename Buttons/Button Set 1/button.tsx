"use client";
import React, {
  useState,
  useEffect,
  useRef,
  JSX,
  forwardRef,
  useImperativeHandle,
} from "react";
import styles from "./button.module.css";
import classNames from "classnames";

/*
 *  A button set that can be used almost anywhere
 *
 *    text? / children? - provide content of the button here, or an...
 *    icon? - you can give the button an icon
 *    variant - has 3 variants, primary, secondary, and tertiary
 *    onClick - the function the button performs
 *    onKeyDown? - this is used to possibly give the button keyboard controls
 *    width? - default: a default width | smallest: button will be as small as possible | full: 100% width | number: the percent width
 *    ariaLabel? - gives the button an aria-label
 *    style?  - any additional CSS stylings
 *
 *    This also has most button html properties as props
 */
interface ButtonProps {
  text?: string;
  children?: React.ReactNode;
  icon?: JSX.Element;
  variant: "primary" | "secondary" | "tertiary";
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e?: React.KeyboardEvent<HTMLButtonElement>) => void;
  width?: "default" | "smallest" | "full" | number;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
  form?: string;
  name?: string;
  title?: string;
  disabled?: boolean;
  draggable?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  id?: string;
  style?: React.CSSProperties;
}

export function Button(
  {
    text,
    children,
    icon,
    variant,
    width = "default",
    onClick,
    onKeyDown,
    ariaLabel,
    type = "button",
    form,
    name,
    title,
    disabled = false,
    draggable,
    autoFocus = false,
    tabIndex,
    id,
    style,
  }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => buttonRef.current!);

  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  //const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [active, setActive] = useState(false);
  const enabled = useRef(true);
  const enterKeyDown = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePointerDown = () => {
    if (enabled.current && !disabled) {
      clearTimeout(timeoutRef.current);
      enabled.current = false;
      setActive(false);
      timeoutRef.current = setTimeout(() => {
        setActive(true);
      }, 40);
    }
  };

  const handlePointerUp = () => {
    if (!enabled.current && !disabled) {
      clearTimeout(timeoutRef.current);
      setActive(true);
      enabled.current = true;
      timeoutRef.current = setTimeout(() => {
        setActive(false);
        onClick?.();
      }, 40);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if ((e.key === "Enter" || e.key === " ") && enabled.current && !disabled) {
      e.preventDefault();
      clearTimeout(timeoutRef.current);
      enabled.current = false;
      enterKeyDown.current = true;
      setActive(true);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !enabled.current && !disabled) {
      e.preventDefault();
      setActive(false);
      timeoutRef.current = setTimeout(() => {
        enabled.current = true;
        enterKeyDown.current = false;
        onClick?.();
      }, 40);
    }
  };

  const handleMouseLeave = () => {
    if (!enterKeyDown.current) {
      enabled.current = true;
      setActive(false);
    }
  };

  const handleBlur = () => {
    enabled.current = true;
    enterKeyDown.current = false;
    setActive(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (buttonRef.current && e.touches.length > 0) {
      const touch = e.touches[0];
      if (
        !buttonRef.current.contains(
          document.elementFromPoint(touch.clientX, touch.clientY)
        )
      ) {
        setActive(false);
        enabled.current = true;
      }
    }
  };

  return (
    <button
      ref={buttonRef}
      id={id}
      name={name}
      title={title}
      className={classNames(styles.button, styles[variant], styles[width], {
        [styles.active]: active,
        [styles.disabled]: disabled,
      })}
      onPointerDown={
        type === "submit" || disabled ? undefined : handlePointerDown
      }
      onPointerUp={type === "submit" || disabled ? undefined : handlePointerUp}
      onTouchMove={handleTouchMove}
      onKeyDown={type === "submit" || disabled ? undefined : handleKeyDown}
      onKeyUp={type === "submit" || disabled ? undefined : handleKeyUp}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      type={type}
      form={form}
      disabled={disabled}
      {...(disabled ? { "aria-disabled": true } : {})}
      draggable={draggable}
      autoFocus={autoFocus}
      tabIndex={disabled ? -1 : tabIndex}
      style={
        typeof width === "number"
          ? { width: `${width}%`, maxWidth: `${width}%`, flexShrink: "unset", ...style }
          : style
      }
    >
      {icon && <div className={styles.icon_container}>{icon}</div>}
      {children || text}
    </button>
  );
}

export default forwardRef<HTMLButtonElement, ButtonProps>(Button);
