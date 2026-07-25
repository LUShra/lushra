import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";
import type { SpacingStep } from "../tokens/tokens";

import styles from "./stack.module.css";

type StackElement = "div" | "section";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between";

export type StackProps = {
  as?: StackElement;
  gap?: SpacingStep;
  align?: StackAlign;
  justify?: StackJustify;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "style">;

const alignClassName: Record<StackAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch
};

const justifyClassName: Record<StackJustify, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween
};

export const Stack = forwardRef(function Stack(
  { as = "div", gap = 4, align, justify, className, children, ...rest }: StackProps,
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
        align && alignClassName[align],
        justify && justifyClassName[justify],
        className
      )
    },
    children
  );
});
