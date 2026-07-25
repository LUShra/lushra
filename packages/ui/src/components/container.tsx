import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";
import type { ContentWidth } from "../tokens/tokens";

import styles from "./container.module.css";

type ContainerElement = "div" | "section" | "main";

export type ContainerProps = {
  as?: ContainerElement;
  width?: ContentWidth;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

const widthClassName: Record<ContentWidth, string> = {
  narrow: styles.narrow,
  default: styles.default,
  wide: styles.wide
};

export const Container = forwardRef(function Container(
  { as = "div", width = "default", className, children, ...rest }: ContainerProps,
  ref: Ref<HTMLElement>
) {
  const element: ElementType = as;

  return createElement(
    element,
    {
      ...rest,
      ref,
      className: cn(styles.root, widthClassName[width], className)
    },
    children
  );
});
