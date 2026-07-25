import type { HTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { useFieldContext } from "./field";
import styles from "./form-message.module.css";

export type FormMessageTone = "neutral" | "success" | "warning" | "error";

export type FormMessageProps = {
  tone?: FormMessageTone;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLParagraphElement>, "className" | "children">;

/**
 * Status is always communicated by icon + text + colour together, never by
 * colour alone (Design Constitution §21; Visual Language §8) -- so every
 * tone below is drawn in, rather than left for a call site to remember.
 */
function ToneIcon({ tone }: { tone: FormMessageTone }) {
  switch (tone) {
    case "success":
      return (
        <svg aria-hidden="true" className={styles.icon} fill="none" viewBox="0 0 16 16">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "warning":
      return (
        <svg aria-hidden="true" className={styles.icon} fill="none" viewBox="0 0 16 16">
          <path
            d="M8 2.5 14.5 13.5h-13L8 2.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M8 6.5v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="8" cy="11.25" fill="currentColor" r="0.75" />
        </svg>
      );
    case "error":
      return (
        <svg aria-hidden="true" className={styles.icon} fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6 6 10 10M10 6 6 10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "neutral":
    default:
      return (
        <svg aria-hidden="true" className={styles.icon} fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7.5v3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="8" cy="5.25" fill="currentColor" r="0.75" />
        </svg>
      );
  }
}

export const FormMessage = forwardRef(function FormMessage(
  { tone = "neutral", className, children, id, ...rest }: FormMessageProps,
  ref: Ref<HTMLParagraphElement>
) {
  const context = useFieldContext();

  return (
    <p
      {...rest}
      className={cn(styles.root, styles[tone], className)}
      id={id ?? context?.messageId}
      ref={ref}
      role={tone === "error" ? "alert" : undefined}
    >
      <ToneIcon tone={tone} />
      <span className={styles.text}>{children}</span>
    </p>
  );
});
