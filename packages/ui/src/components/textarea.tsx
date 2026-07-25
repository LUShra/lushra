import type { Ref, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { useFieldContext } from "./field";
import styles from "./textarea.module.css";

export type TextareaProps = {
  invalid?: boolean;
  valid?: boolean;
  className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export const Textarea = forwardRef(function Textarea(
  {
    invalid,
    valid = false,
    className,
    id,
    required,
    "aria-describedby": describedBy,
    ...rest
  }: TextareaProps,
  ref: Ref<HTMLTextAreaElement>
) {
  const context = useFieldContext();
  const resolvedInvalid = invalid ?? context?.invalid ?? false;

  return (
    <textarea
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
