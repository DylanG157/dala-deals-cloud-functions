import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

/** @type {import("eslint").FlatConfig[]} */
export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      sourceType: "script",
      ecmaVersion: "latest",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "linebreak-style": ["error", "unix"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "args": "none",
        "ignoreRestSiblings": true
      }],
      "no-undef": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
