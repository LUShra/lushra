import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

import jsxA11yRules from "@lushra/eslint-config/jsx-a11y-rules.mjs";

const eslintConfig = [
  // eslint-config-next 16.2.12 exports native flat config directly (verified
  // against the installed version's published source: both entry points
  // are plain arrays of flat-config objects, no legacy eslintrc shape
  // anywhere) -- confirmed by reading dist/core-web-vitals.js and
  // dist/typescript.js directly. Consuming them this way instead of via
  // FlatCompat's legacy extends() is required, not just simpler: FlatCompat
  // routes everything through @eslint/eslintrc's old JSON-schema config
  // validator, which crashes ("Converting circular structure to JSON") on
  // eslint-plugin-react-hooks 7.x's self-referencing plugin object
  // (plugin.configs.flat["recommended-latest"].plugins["react-hooks"] ===
  // plugin) -- a legitimate, intentional flat-config pattern that only the
  // legacy validator's JSON.stringify-based error formatting chokes on.
  // These configs already register the @typescript-eslint, react,
  // react-hooks, and jsx-a11y plugins themselves, so nothing below may
  // re-register any of those plugin names -- only rule-level additions are
  // layered on top.
  ...nextCoreWebVitals,
  ...nextTypescript,
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
