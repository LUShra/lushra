import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { Spinner } from "./spinner";
import styles from "./button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "ghost"
  | "danger";

export type ButtonSize = "small" | "medium" | "large";

const spinnerSizeByButtonSize: Record<ButtonSize, "small" | "medium"> = {
  small: "small",
  medium: "small",
  large: "medium"
};

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "medium",
    loading = false,
    disabled = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = "button",
    ...rest
  }: ButtonProps,
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
        <Spinner className={styles.icon} size={spinnerSizeByButtonSize[size]} />
      ) : leadingIcon ? (
        <span aria-hidden="true" className={styles.icon}>
          {leadingIcon}
        </span>
      ) : null}

      <span className={styles.label}>{children}</span>

      {!loading && trailingIcon ? (
        <span aria-hidden="true" className={styles.icon}>
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
});
