import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

import baseConfig from "./base.mjs";

const reactConfig = [
  ...baseConfig,
  {
    files: ["**/*.tsx", "**/*.jsx"],
    ...reactHooks.configs["recommended-latest"]
  },
  jsxA11y.flatConfigs.recommended
];

export default reactConfig;
