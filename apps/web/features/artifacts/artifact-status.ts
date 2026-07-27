import type { BadgeVariant } from "@lushra/ui";

export const ARTIFACT_STATUSES = ["draft", "in_review", "approved", "rejected"] as const;

export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const ARTIFACT_STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected"
};

export const ARTIFACT_STATUS_BADGE_VARIANTS: Record<ArtifactStatus, BadgeVariant> = {
  draft: "neutral",
  in_review: "info",
  approved: "success",
  rejected: "danger"
};
