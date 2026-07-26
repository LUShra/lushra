import type { ReactNode } from "react";

import { Sidebar } from "./sidebar";
import { SkipLink } from "./skip-link";
import { TopHeader } from "./top-header";
import styles from "./app-shell.module.css";

export type AppShellProps = {
  children: ReactNode;
  userEmail: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className={styles.root}>
      <SkipLink />
      <Sidebar />

      <div className={styles.column}>
        <TopHeader userEmail={userEmail} />

        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
