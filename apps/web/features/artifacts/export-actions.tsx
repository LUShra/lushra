"use client";

import { useState } from "react";

import { Button, FormMessage, Inline, Stack, Text } from "@lushra/ui";

import { copyToClipboard, downloadTextFile, sanitizeFilename } from "./export-utils";

type FeedbackState = { tone: "success" | "error"; message: string } | null;

export type ExportActionsProps = {
  /** The exact text to export -- either an artifact's current content or one saved version's snapshot. */
  content: string | null;
  /** Used to derive the downloaded filename; not displayed. */
  titleForFilename: string;
};

export function ExportActions({ content, titleForFilename }: ExportActionsProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const hasContent = Boolean(content && content.trim().length > 0);

  async function handleCopy() {
    if (!content) {
      return;
    }

    const copied = await copyToClipboard(content);
    setFeedback(
      copied
        ? { tone: "success", message: "Copied to clipboard." }
        : { tone: "error", message: "Couldn't copy to clipboard." }
    );
  }

  function handleDownload(extension: "txt" | "md", mimeType: string) {
    if (!content) {
      return;
    }

    const filenameBase = sanitizeFilename(titleForFilename);
    downloadTextFile(`${filenameBase}.${extension}`, content, mimeType);
    setFeedback({ tone: "success", message: `Downloaded as .${extension}.` });
  }

  if (!hasContent) {
    return <Text color="secondary">Add content before exporting.</Text>;
  }

  return (
    <Stack gap={2}>
      <Inline gap={3} wrap>
        <Button onClick={handleCopy} size="small" type="button" variant="secondary">
          Copy
        </Button>
        <Button
          onClick={() => handleDownload("txt", "text/plain")}
          size="small"
          type="button"
          variant="secondary"
        >
          Export as plain text
        </Button>
        <Button
          onClick={() => handleDownload("md", "text/markdown")}
          size="small"
          type="button"
          variant="secondary"
        >
          Export as Markdown
        </Button>
      </Inline>

      {feedback ? <FormMessage tone={feedback.tone}>{feedback.message}</FormMessage> : null}
    </Stack>
  );
}
