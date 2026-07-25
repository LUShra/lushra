import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";

import styles from "./visually-hidden.module.css";

export type VisuallyHiddenProps = {
  as?: "span" | "div";
  focusable?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export const VisuallyHidden = forwardRef(function VisuallyHidden(
  { as = "span", focusable = false, className, children, ...rest }: VisuallyHiddenProps,
  ref: Ref<HTMLElement>
) {
  const element: ElementType = as;

  return createElement(
    element,
    {
      ...rest,
      ref,
      className: cn(styles.root, focusable && styles.focusable, className)
    },
    children
  );
});
