import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
];
