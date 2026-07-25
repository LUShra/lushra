import { NextResponse } from "next/server";

type SupabaseCheck =
  | { status: "healthy"; latencyMs: number }
  | { status: "not_configured" }
  | { status: "unavailable" };

async function checkSupabase(): Promise<SupabaseCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { status: "not_configured" };
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(5000)
    });

    return response.ok
      ? { status: "healthy", latencyMs: Date.now() - startedAt }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

export async function GET(): Promise<NextResponse> {
  const supabase = await checkSupabase();
  const status = supabase.status === "healthy" ? "healthy" : "degraded";

  return NextResponse.json(
    {
      service: "lushra-web",
      status,
      timestamp: new Date().toISOString(),
      checks: {
        supabase
      }
    },
    {
      status: status === "healthy" ? 200 : 503
    }
  );
}
