import jsxA11y from "eslint-plugin-jsx-a11y";

// Rules only -- no `plugins` key. For consumers (like apps/web) where
// something else in the flat config array already registers the jsx-a11y
// plugin, since ESLint's flat config does not allow the same plugin name to
// be registered twice with different object instances.
const jsxA11yRules = {
  files: ["**/*.tsx", "**/*.jsx"],
  rules: jsxA11y.flatConfigs.recommended.rules
};

export default jsxA11yRules;
