"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/app/ui/Buttons/Button Set 1/button";
import styles from "./confirmationBox.module.css";
import classNames from "classnames";

interface ConfirmationBoxProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export default function ConfirmationBox({
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  ariaLabel,
  style,
}: ConfirmationBoxProps) {
  return (
    <div
      className={styles.confirmation_box}
      style={{ ...style }}
      aria-label={ariaLabel}
    >
      <div className={styles.message}>{message}</div>
      <div className={styles.buttons_wrapper}>
        <Button variant="tertiary" onClick={onCancel} width={"full"}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onConfirm} width={"full"}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
}
