import type { ReactNode } from "react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function OverviewIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M3 9.5 10 3l7 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M5 8.5V16a.5.5 0 0 0 .5.5H8v-4a2 2 0 0 1 4 0v4h2.5a.5.5 0 0 0 .5-.5V8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M3 6.5A1.5 1.5 0 0 1 4.5 5h3.086a1 1 0 0 1 .707.293L9.5 6.5H15.5A1.5 1.5 0 0 1 17 8v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14V6.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <circle cx="8.5" cy="8.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m15 15-2.5-2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M3 10.5h3l1.5-4 3 7 1.5-3H17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M4 6h5.5M13 6h2.5M4 10h.5M8 10h7.5M4 14h5.5M13 14h2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="11" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export const navigationItems: NavigationItem[] = [
  { href: "/workspace", label: "Overview", icon: <OverviewIcon /> },
  { href: "/workspace/projects", label: "Projects", icon: <ProjectsIcon /> },
  { href: "/workspace/search", label: "Search", icon: <SearchIcon /> },
  { href: "/workspace/activity", label: "Activity", icon: <ActivityIcon /> },
  { href: "/workspace/settings", label: "Settings", icon: <SettingsIcon /> }
];
