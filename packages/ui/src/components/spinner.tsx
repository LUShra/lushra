import type { HTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { VisuallyHidden } from "./visually-hidden";
import styles from "./spinner.module.css";

export type SpinnerSize = "small" | "medium" | "large";

export type SpinnerProps = {
  size?: SpinnerSize;
  /**
   * Accessible label. When provided, the spinner announces itself as a live
   * status region. Omit it only when an adjacent element already carries
   * the accessible status (for example a button with `aria-busy`) --
   * otherwise the spinner renders decorative and invisible to assistive
   * technology (Design Constitution §17; Interaction System §14).
   */
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">;

export const Spinner = forwardRef(function Spinner(
  { size = "medium", label, className, ...rest }: SpinnerProps,
  ref: Ref<HTMLSpanElement>
) {
  if (label) {
    return (
      <span
        {...rest}
        aria-live="polite"
        className={cn(styles.root, styles[size], className)}
        ref={ref}
        role="status"
      >
        <VisuallyHidden>{label}</VisuallyHidden>
      </span>
    );
  }

  return (
    <span
      {...rest}
      aria-hidden="true"
      className={cn(styles.root, styles[size], className)}
      ref={ref}
    />
  );
});
