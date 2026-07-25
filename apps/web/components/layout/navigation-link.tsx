"use client";

import { cn } from "@lushra/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./navigation-link.module.css";

export type NavigationLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: () => void;
};

export function NavigationLink({ href, label, icon, onNavigate }: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/workspace"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(styles.root, isActive && styles.active)}
      href={href}
      onClick={onNavigate}
    >
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
