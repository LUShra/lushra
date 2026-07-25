import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { createElement, forwardRef } from "react";

import { cn } from "../lib/cn";

import styles from "./text.module.css";

export type TextRole =
  | "body-large"
  | "body"
  | "body-small"
  | "label"
  | "caption"
  | "code"
  | "numeric";

export type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

type TextElement = "p" | "span" | "div" | "code";

const defaultElementByRole: Record<TextRole, TextElement> = {
  "body-large": "p",
  body: "p",
  "body-small": "p",
  label: "span",
  caption: "span",
  code: "code",
  numeric: "span"
};

const roleClassName: Record<TextRole, string> = {
  "body-large": styles.bodyLarge,
  body: styles.body,
  "body-small": styles.bodySmall,
  label: styles.label,
  caption: styles.caption,
  code: styles.code,
  numeric: styles.numeric
};

const colorClassName: Record<TextColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  tertiary: styles.colorTertiary,
  inverse: styles.colorInverse,
  accent: styles.colorAccent,
  info: styles.colorInfo,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger
};

export type TextProps = {
  role?: TextRole;
  as?: TextElement;
  color?: TextColor;
  truncate?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "color">;

export const Text = forwardRef(function Text(
  {
    role = "body",
    as,
    color = "primary",
    truncate = false,
    className,
    children,
    ...rest
  }: TextProps,
  ref: Ref<HTMLElement>
) {
  const element: ElementType = as ?? defaultElementByRole[role];

  return createElement(
    element,
    {
      ...rest,
      ref,
      className: cn(
        styles.root,
        roleClassName[role],
        colorClassName[color],
        truncate && styles.truncate,
        className
      )
    },
    children
  );
});
