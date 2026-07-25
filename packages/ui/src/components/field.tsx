import type { HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useId } from "react";

import { cn } from "../lib/cn";

import styles from "./field.module.css";

/**
 * Field coordinates Label, a control, an optional description, and
 * FormMessage entirely through composition + Context -- never by cloning
 * children or reading a global store. A single `useId()` call per Field
 * instance is the one source of truth every id below is derived from, so
 * the description/error association is always correct regardless of which
 * optional pieces a given form actually renders.
 */
type FieldContextValue = {
  controlId: string;
  descriptionId: string;
  messageId: string;
  describedBy: string;
  invalid: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export type FieldProps = {
  invalid?: boolean;
  required?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

function FieldRoot({
  invalid = false,
  required = false,
  className,
  children,
  ...rest
}: FieldProps) {
  const baseId = useId();

  const controlId = `${baseId}-control`;
  const descriptionId = `${baseId}-description`;
  const messageId = `${baseId}-message`;

  const value: FieldContextValue = {
    controlId,
    descriptionId,
    messageId,
    describedBy: `${descriptionId} ${messageId}`,
    invalid,
    required
  };

  return (
    <FieldContext.Provider value={value}>
      <div {...rest} className={cn(styles.root, className)}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

export type FieldDescriptionProps = {
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLParagraphElement>, "className" | "children">;

function FieldDescription({ className, children, ...rest }: FieldDescriptionProps) {
  const context = useFieldContext();

  return (
    <p {...rest} className={cn(styles.description, className)} id={context?.descriptionId}>
      {children}
    </p>
  );
}

export const Field = Object.assign(FieldRoot, { Description: FieldDescription });
