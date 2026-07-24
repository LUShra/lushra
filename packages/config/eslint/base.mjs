import tsPlugin from "@typescript-eslint/eslint-plugin";

const baseConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/*.tsbuildinfo"
    ]
  },
  ...tsPlugin.configs["flat/recommended"]
];

export default baseConfig;
