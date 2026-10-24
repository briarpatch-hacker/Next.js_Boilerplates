"use client";
import NotFound from "@/app/components/Errors/Not Found/notFound";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <div className={styles.not_found}>
      <NotFound
        errorMessage={"The page wasn't found."}
        buttonText="Return Home"
        href="/"
      />
    </div>
  );
}
