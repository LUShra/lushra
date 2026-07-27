import { Container, Spinner } from "@lushra/ui";

import styles from "./route-loading.module.css";

/**
 * Shared `loading.tsx` fallback for every workspace route segment. Next.js
 * wraps each segment that has one in its own Suspense boundary, so the
 * persistent shell (sidebar, header) stays interactive immediately while
 * only the segment's own data fetch streams in behind this -- a standard,
 * purely additive Next.js App Router optimization that changes nothing
 * about what data loads or how, only how soon something is visible.
 */
export function RouteLoading() {
  return (
    <Container as="section" className={styles.root} width="wide">
      <Spinner label="Loading" size="large" />
    </Container>
  );
}
