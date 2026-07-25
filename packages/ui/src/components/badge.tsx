import type { HTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import styles from "./badge.module.css";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type BadgeProps = {
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children" | "onClick">;

export const Badge = forwardRef(function Badge(
  { variant = "neutral", icon, className, children, ...rest }: BadgeProps,
  ref: Ref<HTMLSpanElement>
) {
  return (
    <span {...rest} className={cn(styles.root, styles[variant], className)} ref={ref}>
      {icon ? (
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </span>
  );
});
