export const ARTIFACT_TYPES = [
  "brief",
  "specification",
  "structured_document",
  "marketing_copy",
  "research_synthesis",
  "content_outline"
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  brief: "Brief",
  specification: "Specification",
  structured_document: "Structured document",
  marketing_copy: "Marketing copy",
  research_synthesis: "Research synthesis",
  content_outline: "Content outline"
};
