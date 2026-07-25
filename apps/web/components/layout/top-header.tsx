import Link from "next/link";

import { MobileNavigation } from "./mobile-navigation";
import styles from "./top-header.module.css";

function AccountIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 16.5c1.2-3 3.6-4.5 6-4.5s4.8 1.5 6 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function TopHeader() {
  return (
    <header className={styles.root}>
      <div className={styles.leading}>
        <MobileNavigation />

        <Link className={styles.wordmark} href="/workspace">
          Lushra
        </Link>
      </div>

      <Link aria-label="Account settings" className={styles.accountAction} href="/workspace/settings">
        <AccountIcon />
      </Link>
    </header>
  );
}
