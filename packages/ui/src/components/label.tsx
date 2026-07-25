"use client";

import type { LabelHTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { useFieldContext } from "./field";
import styles from "./label.module.css";

export type LabelProps = {
  className?: string;
  children: ReactNode;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, "className" | "children">;

export const Label = forwardRef(function Label(
  { htmlFor, className, children, ...rest }: LabelProps,
  ref: Ref<HTMLLabelElement>
) {
  const context = useFieldContext();
  const required = context?.required ?? false;

  return (
    <label
      {...rest}
      className={cn(styles.root, className)}
      htmlFor={htmlFor ?? context?.controlId}
      ref={ref}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className={styles.required}>
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
});
