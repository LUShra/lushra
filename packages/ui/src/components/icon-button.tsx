import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { Spinner } from "./spinner";
import styles from "./icon-button.module.css";

export type IconButtonVariant = "neutral" | "subtle" | "danger";
export type IconButtonSize = "small" | "medium" | "large";

const spinnerSizeByIconButtonSize: Record<IconButtonSize, "small" | "medium"> = {
  small: "small",
  medium: "small",
  large: "medium"
};

export type IconButtonProps = {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label": string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "aria-label"
>;

export const IconButton = forwardRef(function IconButton(
  {
    variant = "neutral",
    size = "medium",
    loading = false,
    disabled = false,
    className,
    children,
    type = "button",
    ...rest
  }: IconButtonProps,
  ref: Ref<HTMLButtonElement>
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      aria-busy={loading || undefined}
      className={cn(
        styles.root,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className
      )}
      disabled={isDisabled}
      ref={ref}
      type={type}
    >
      {loading ? (
        <Spinner className={styles.icon} size={spinnerSizeByIconButtonSize[size]} />
      ) : (
        <span aria-hidden="true" className={styles.icon}>
          {children}
        </span>
      )}
    </button>
  );
});
