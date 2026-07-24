/**
 * Typed metadata mirroring the CSS custom properties defined in
 * packages/ui/src/styles/. This is the compile-time half of the token
 * foundation — the runtime values live only in CSS (single source of
 * truth); these unions and lookup maps exist so component props can be
 * constrained to a valid role name instead of an arbitrary string.
 */

export const colorRoles = [
  "canvas",
  "surface",
  "surface-raised",
  "surface-inset",
  "surface-interactive",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-inverse",
  "border-default",
  "border-strong",
  "border-subtle",
  "accent",
  "accent-hover",
  "accent-active",
  "accent-foreground",
  "focus",
  "info",
  "success",
  "warning",
  "danger",
  "selection"
] as const;

export type ColorRole = (typeof colorRoles)[number];

export const colorRoleVar: Record<ColorRole, string> = Object.fromEntries(
  colorRoles.map((role) => [role, `var(--color-${role})`])
) as Record<ColorRole, string>;

export const typographyRoles = [
  "display",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "body-large",
  "body",
  "body-small",
  "label",
  "caption",
  "code",
  "numeric"
] as const;

export type TypographyRole = (typeof typographyRoles)[number];

export const spacingSteps = [
  0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24
] as const;

export type SpacingStep = (typeof spacingSteps)[number];

export const radiusSteps = ["xs", "sm", "md", "lg", "xl", "full"] as const;

export type RadiusStep = (typeof radiusSteps)[number];

export const shadowLevels = ["none", "raised", "overlay"] as const;

export type ShadowLevel = (typeof shadowLevels)[number];

export const motionDurations = [
  "instant",
  "fast",
  "base",
  "slow",
  "deliberate"
] as const;

export type MotionDuration = (typeof motionDurations)[number];

export const motionEasings = [
  "standard",
  "decelerate",
  "accelerate",
  "emphasized"
] as const;

export type MotionEasing = (typeof motionEasings)[number];

export const zIndexLevels = [
  "base",
  "sticky",
  "dropdown",
  "overlay",
  "modal",
  "toast",
  "tooltip"
] as const;

export type ZIndexLevel = (typeof zIndexLevels)[number];

export const contentWidths = ["narrow", "default", "wide"] as const;

export type ContentWidth = (typeof contentWidths)[number];

/**
 * Breakpoint ownership: this foundation defines and names the device-class
 * scale; per-component adaptive composition is owned by the Component
 * Architecture (docs/10, Milestone 2B+). CSS custom properties cannot be
 * used inside @media conditions, so these literal values are the
 * authoritative numbers any @media rule must match.
 */
export type BreakpointName =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop"
  | "ultrawide";

export const breakpoints: Record<BreakpointName, number> = {
  mobile: 0,
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
  ultrawide: 1920
};
