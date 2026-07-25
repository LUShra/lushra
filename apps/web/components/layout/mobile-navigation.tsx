"use client";

import { IconButton } from "@lushra/ui";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { navigationItems } from "./navigation-items";
import { NavigationLink } from "./navigation-link";
import styles from "./mobile-navigation.module.css";

function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M3 5.5h14M3 10h14M3 14.5h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function MobileNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  function openDrawer() {
    dialogRef.current?.showModal();
    setIsOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  }

  function closeDrawer() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    function handleClose() {
      setIsOpen(false);
      setIsVisible(false);
      triggerRef.current?.focus();
    }

    dialog.addEventListener("close", handleClose);

    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      closeDrawer();
    }
  }

  return (
    <>
      <IconButton
        aria-label="Open navigation"
        className={styles.trigger}
        onClick={openDrawer}
        ref={triggerRef}
        variant="neutral"
      >
        <MenuIcon />
      </IconButton>

      <dialog
        aria-label="Mobile navigation"
        className={styles.dialog}
        data-visible={isVisible || undefined}
        onClick={handleBackdropClick}
        ref={dialogRef}
      >
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.wordmark}>Lushra</span>

            <IconButton aria-label="Close navigation" onClick={closeDrawer} variant="neutral">
              <CloseIcon />
            </IconButton>
          </div>

          <nav aria-label="Mobile" className={styles.nav}>
            {navigationItems.map((item) => (
              <NavigationLink
                href={item.href}
                icon={item.icon}
                key={item.href}
                label={item.label}
                onNavigate={closeDrawer}
              />
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
