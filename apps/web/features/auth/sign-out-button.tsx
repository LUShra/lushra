import { Button } from "@lushra/ui";

import { signOutAction } from "./auth-actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button size="small" type="submit" variant="secondary">
        Sign out
      </Button>
    </form>
  );
}
