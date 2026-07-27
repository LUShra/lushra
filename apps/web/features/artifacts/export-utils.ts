/**
 * Browser-only helpers (Blob, document, navigator.clipboard). Only ever
 * called from "use client" components -- never imported by a Server
 * Component or Server Action.
 */

const MAX_FILENAME_LENGTH = 80;

/** Falls back to "artifact" if the title has nothing usable left after sanitizing. */
export function sanitizeFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH);

  return slug.length > 0 ? slug : "artifact";
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** Returns false rather than throwing when the Clipboard API is unavailable (older browsers, non-secure contexts). */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
