import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
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

  return <AppShell userEmail={user.email ?? null}>{children}</AppShell>;
}
