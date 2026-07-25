import styles from "./skip-link.module.css";

export function SkipLink() {
  return (
    <a className={styles.root} href="#main-content">
      Skip to main content
    </a>
  );
}
