import { Card, Container, Heading, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { SignOutButton } from "@/features/auth/sign-out-button";

import styles from "./workspace-error.module.css";

/**
 * Rendered by the workspace layout in place of the whole authenticated
 * shell when ensure_personal_workspace() fails -- every other workspace
 * page depends on that same workspace, so a partial shell (sidebar,
 * settings link) would just point at more broken pages, not real
 * recovery. Deliberately generic: no SQL, Supabase payload, stack trace,
 * ID, or policy name is ever surfaced here.
 */
export function WorkspaceError() {
  return (
    <Container as="main" className={styles.page} width="narrow">
      <Card as="section" className={styles.card}>
        <Stack gap={6}>
          <Stack gap={3}>
            <Heading level={1}>We couldn&apos;t prepare your workspace</Heading>
            <Text color="secondary">
              Something went wrong while setting up your workspace. This is usually temporary.
            </Text>
          </Stack>

          <Stack gap={4}>
            <Text>
              <Link href="/workspace">Try again</Link>
            </Text>

            <SignOutButton />
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
