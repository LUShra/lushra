export const SOURCE_TYPES = ["link", "text"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  link: "Link",
  text: "Text"
};
