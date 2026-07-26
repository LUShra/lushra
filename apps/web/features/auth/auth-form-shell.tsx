import type { ReactNode } from "react";

import { Card, Container, Heading, Stack, Text } from "@lushra/ui";

import styles from "./auth-form-shell.module.css";

export type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthFormShell({ title, description, children }: AuthFormShellProps) {
  return (
    <Container as="main" className={styles.page} width="narrow">
      <Card as="section" className={styles.card}>
        <Stack gap={8}>
          <Stack gap={3}>
            <Heading level={1}>{title}</Heading>
            <Text color="secondary">{description}</Text>
          </Stack>

          {children}
        </Stack>
      </Card>
    </Container>
  );
}
