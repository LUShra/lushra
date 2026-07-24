import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import jsxA11yRules from "@lushra/eslint-config/jsx-a11y-rules.mjs";

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);

const compat = new FlatCompat({
  baseDirectory: directory
});

const eslintConfig = [
  // eslint-config-next has no native flat-config export yet (verified against
  // the installed 15.5.21), so FlatCompat remains required to consume it. It
  // already registers the @typescript-eslint, react, react-hooks, and
  // jsx-a11y plugins itself (confirmed by reading its source directly), so
  // nothing added below may re-register any of those plugin names -- only
  // rule-level additions are layered on top.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "next-env.d.ts"
    ]
  },
  // Upgrades Next's built-in jsx-a11y coverage (6 rules, all at "warn") to
  // the plugin's full recommended rule set, without re-registering the
  // plugin itself, which Next already provides.
  jsxA11yRules
];

export default eslintConfig;
