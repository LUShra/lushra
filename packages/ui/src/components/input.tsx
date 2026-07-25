import type { InputHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { useFieldContext } from "./field";
import styles from "./input.module.css";

export type InputProps = {
  invalid?: boolean;
  valid?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export const Input = forwardRef(function Input(
  {
    invalid,
    valid = false,
    className,
    id,
    required,
    "aria-describedby": describedBy,
    ...rest
  }: InputProps,
  ref: Ref<HTMLInputElement>
) {
  const context = useFieldContext();
  const resolvedInvalid = invalid ?? context?.invalid ?? false;

  return (
    <input
      {...rest}
      aria-describedby={describedBy ?? context?.describedBy}
      aria-invalid={resolvedInvalid || undefined}
      className={cn(
        styles.root,
        resolvedInvalid && styles.invalid,
        valid && styles.valid,
        className
      )}
      id={id ?? context?.controlId}
      ref={ref}
      required={required ?? context?.required ?? false}
    />
  );
});
