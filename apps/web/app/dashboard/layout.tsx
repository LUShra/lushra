import Link from "next/link";
import type { ReactNode } from "react";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

const navigation = [
  {
    href: "/dashboard",
    label: "Overview"
  },
  {
    href: "/dashboard/projects",
    label: "Projects"
  },
  {
    href: "/dashboard/activity",
    label: "Activity"
  },
  {
    href: "/dashboard/settings",
    label: "Settings"
  }
];

export default function DashboardLayout({
  children
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/">
          Lushra
        </Link>

        <nav aria-label="Dashboard navigation" className="dashboard-nav">
          {navigation.map((item) => (
            <Link
              className="dashboard-nav__link"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          <p>Platform foundation</p>
          <span>Development environment</span>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-header__label">Workspace</p>
            <strong>Lushra Platform</strong>
          </div>

          <div className="dashboard-profile" aria-label="User profile">
            LU
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
