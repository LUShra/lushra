import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

import baseConfig from "./base.mjs";

const reactConfig = [
  ...baseConfig,
  {
    files: ["**/*.tsx", "**/*.jsx"],
    // eslint-plugin-react-hooks 7.x split its exports: configs["recommended-latest"]
    // kept the legacy eslintrc-style `plugins: ["react-hooks"]` (array of
    // strings) shape for backwards compatibility, and moved the flat-config
    // shape (`plugins: { "react-hooks": plugin }`) to configs.flat -- using
    // the old path directly under ESLint 10's flat config throws "plugins"
    // key... must be an object".
    ...reactHooks.configs.flat["recommended-latest"]
  },
  jsxA11y.flatConfigs.recommended
];

export default reactConfig;
