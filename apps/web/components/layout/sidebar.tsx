import Link from "next/link";

import { navigationItems } from "./navigation-items";
import { NavigationLink } from "./navigation-link";
import styles from "./sidebar.module.css";

export function Sidebar() {
  const [overview, projects, activity, settings] = navigationItems;
  const primaryItems = [overview, projects, activity];

  return (
    <aside className={styles.root}>
      <Link className={styles.wordmark} href="/workspace">
        Lushra
      </Link>

      <nav aria-label="Primary" className={styles.nav}>
        <div className={styles.primaryGroup}>
          {primaryItems.map((item) => (
            <NavigationLink href={item.href} icon={item.icon} key={item.href} label={item.label} />
          ))}
        </div>

        <div className={styles.settingsGroup}>
          <NavigationLink href={settings.href} icon={settings.icon} label={settings.label} />
        </div>
      </nav>
    </aside>
  );
}
