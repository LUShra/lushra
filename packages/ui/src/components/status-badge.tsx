import type { ReactNode } from "react";

export type StatusBadgeProps = {
  children: ReactNode;
};

export function StatusBadge({
  children
}: StatusBadgeProps) {
  return (
    <span className="status-badge">
      {children}
    </span>
  );
}
