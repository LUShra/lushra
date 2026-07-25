import type { HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";

import styles from "./heading.module.css";

export type HeadingVisualRole =
  | "display"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4";

export type HeadingColor = "primary" | "secondary" | "inverse";

type HeadingSharedProps = {
  color?: HeadingColor;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLHeadingElement>, "className" | "children" | "color">;

/**
 * Levels 1-4 map onto a dedicated typography token 1:1, so `visualRole` may
 * be omitted. No token exists for a 5th or 6th visual size, so levels 5 and
 * 6 require an explicit `visualRole` at the type level -- there is no
 * invented default to fall back to (Design Constitution §14, §26).
 */
export type HeadingProps =
  | (HeadingSharedProps & { level: 1 | 2 | 3 | 4; visualRole?: HeadingVisualRole })
  | (HeadingSharedProps & { level: 5 | 6; visualRole: HeadingVisualRole });

const defaultVisualRoleByLevel: Record<1 | 2 | 3 | 4, HeadingVisualRole> = {
  1: "heading-1",
  2: "heading-2",
  3: "heading-3",
  4: "heading-4"
};

const visualRoleClassName: Record<HeadingVisualRole, string> = {
  display: styles.display,
  "heading-1": styles.heading1,
  "heading-2": styles.heading2,
  "heading-3": styles.heading3,
  "heading-4": styles.heading4
};

const colorClassName: Record<HeadingColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  inverse: styles.colorInverse
};

export const Heading = forwardRef(function Heading(
  { level, visualRole, color = "primary", className, children, ...rest }: HeadingProps,
  ref: Ref<HTMLHeadingElement>
) {
  const resolvedVisualRole =
    visualRole ?? defaultVisualRoleByLevel[level as 1 | 2 | 3 | 4];
  const tag = `h${level}` as const;

  return createElement(
    tag,
    {
      ...rest,
      ref,
      className: cn(
        styles.root,
        visualRoleClassName[resolvedVisualRole],
        colorClassName[color],
        className
      )
    },
    children
  );
});
