import type { HTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";

import { cn } from "../lib/cn";

import { Surface, type SurfaceVariant } from "./surface";
import styles from "./card.module.css";

type CardElement = "div" | "article" | "section";

export type CardProps = {
  as?: CardElement;
  variant?: SurfaceVariant;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export const Card = forwardRef(function Card(
  { as = "article", variant = "raised", className, children, ...rest }: CardProps,
  ref: Ref<HTMLElement>
) {
  return (
    <Surface
      {...rest}
      as={as}
      className={cn(styles.root, className)}
      ref={ref}
      variant={variant}
    >
      {children}
    </Surface>
  );
});
