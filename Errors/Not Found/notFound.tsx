"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./notFound.module.css";
import MessageBox from "@/app/ui/Message Box/messageBox";

// The 404 component
export default function NotFound({
  errorMessage = `There isn't anything on this page`,
  buttonText = `Return Home`,
  href = `/`,
}: {
  errorMessage?: string;
  buttonText?: string;
  href?: string;
}) {
  return (
    <div className={styles.error_wrapper}>
      <MessageBox
        href={href}
        message={errorMessage}
        buttonText={buttonText}
        ariaLive="assertive"
        role="alert"
      />
    </div>
  );
}
