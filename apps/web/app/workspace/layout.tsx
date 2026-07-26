import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";
import { WorkspaceError } from "@/features/workspace/workspace-error";
import { createClient } from "@/lib/supabase/server";

type WorkspaceLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return <WorkspaceError />;
  }

  return (
    <AppShell userEmail={user.email ?? null} workspaceName={workspaceResult.workspace.name}>
      {children}
    </AppShell>
  );
}
