import { Container, Heading, Inline, Stack, Text } from "@lushra/ui";
import type { ReactNode } from "react";

import styles from "./page-frame.module.css";

export type PageFrameProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageFrame({ eyebrow, title, description, actions, children }: PageFrameProps) {
  return (
    <Container as="section" className={styles.root} width="wide">
      <Stack gap={8}>
        <Inline align="start" gap={6} justify="between" wrap>
          <Stack gap={2}>
            {eyebrow ? (
              // eslint-disable-next-line jsx-a11y/aria-role -- Text's `role` is a typography role, not an ARIA role.
              <Text color="secondary" role="label">
                {eyebrow}
              </Text>
            ) : null}

            <Heading level={1}>{title}</Heading>

            {description ? (
              <Text className={styles.description} color="secondary">
                {description}
              </Text>
            ) : null}
          </Stack>

          {actions ? (
            <Inline gap={3} wrap>
              {actions}
            </Inline>
          ) : null}
        </Inline>

        {children}
      </Stack>
    </Container>
  );
}
