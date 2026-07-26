"use client";

import type { Ref, SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { useFieldContext } from "./field";
import styles from "./select.module.css";

export type SelectProps = {
  invalid?: boolean;
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">;

export const Select = forwardRef(function Select(
  { invalid, className, id, required, "aria-describedby": describedBy, ...rest }: SelectProps,
  ref: Ref<HTMLSelectElement>
) {
  const context = useFieldContext();
  const resolvedInvalid = invalid ?? context?.invalid ?? false;

  return (
    <select
      {...rest}
      aria-describedby={describedBy ?? context?.describedBy}
      aria-invalid={resolvedInvalid || undefined}
      className={cn(styles.root, resolvedInvalid && styles.invalid, className)}
      id={id ?? context?.controlId}
      ref={ref}
      required={required ?? context?.required ?? false}
    />
  );
});
