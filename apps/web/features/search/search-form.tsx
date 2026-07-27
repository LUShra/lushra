import { Button, Field, Inline, Input, Label, VisuallyHidden } from "@lushra/ui";

import styles from "./search-form.module.css";

export type SearchFormProps = {
  defaultValue?: string;
};

export function SearchForm({ defaultValue = "" }: SearchFormProps) {
  return (
    <form action="/workspace/search" method="get" role="search">
      <Inline align="end" gap={3}>
        <Field className={styles.field}>
          <VisuallyHidden>
            <Label>Search</Label>
          </VisuallyHidden>
          <Input
            defaultValue={defaultValue}
            maxLength={200}
            name="q"
            placeholder="Search projects, artifacts, and sources..."
            type="search"
          />
        </Field>

        <Button type="submit">Search</Button>
      </Inline>
    </form>
  );
}
