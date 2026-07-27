import { headers } from "next/headers";

/**
 * Vercel's edge network terminates the client connection and sets this
 * header itself (the client cannot forge it there), with the true client
 * address first in a comma-separated list. Falls back to "unknown" -- a
 * single shared bucket -- outside Vercel (e.g. local dev behind no
 * proxy), which under-protects rather than over-blocks in that case; the
 * real deployed environment is what this exists to protect.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");

  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    const candidate = first?.trim();

    if (candidate) {
      return candidate;
    }
  }

  return headerList.get("x-real-ip") ?? "unknown";
}
