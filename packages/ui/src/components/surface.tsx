import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";

import styles from "./surface.module.css";

export type SurfaceVariant = "base" | "raised" | "inset" | "interactive";

type SurfaceElement = "div" | "section" | "article";

export type SurfaceProps = {
  as?: SurfaceElement;
  variant?: SurfaceVariant;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

const variantClassName: Record<SurfaceVariant, string> = {
  base: styles.base,
  raised: styles.raised,
  inset: styles.inset,
  interactive: styles.interactive
};

export const Surface = forwardRef(function Surface(
  { as = "div", variant = "base", className, children, ...rest }: SurfaceProps,
  ref: Ref<HTMLElement>
) {
  const element: ElementType = as;

  return createElement(
    element,
    {
      ...rest,
      ref,
      className: cn(styles.root, variantClassName[variant], className)
    },
    children
  );
});
