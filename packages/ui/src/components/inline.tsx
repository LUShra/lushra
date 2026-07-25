import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";
import type { SpacingStep } from "../tokens/tokens";

import styles from "./inline.module.css";

type InlineElement = "div" | "span";
export type InlineAlign = "start" | "center" | "end" | "stretch";
export type InlineJustify = "start" | "center" | "end" | "between";

export type InlineProps = {
  as?: InlineElement;
  gap?: SpacingStep;
  align?: InlineAlign;
  justify?: InlineJustify;
  wrap?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "style">;

const alignClassName: Record<InlineAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch
};

const justifyClassName: Record<InlineJustify, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween
};

export const Inline = forwardRef(function Inline(
  { as = "div", gap = 3, align, justify, wrap = false, className, children, ...rest }: InlineProps,
  ref: Ref<HTMLElement>
) {
  const element: ElementType = as;
  const style: CSSProperties = { gap: `var(--lushra-space-${gap})` };

  return createElement(
    element,
    {
      ...rest,
      ref,
      style,
      className: cn(
        styles.root,
        wrap && styles.wrap,
        align && alignClassName[align],
        justify && justifyClassName[justify],
        className
      )
    },
    children
  );
});
