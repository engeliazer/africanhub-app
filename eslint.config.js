import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

const settings = {
  react: {
    version: "detect" // Automatically detect the version of React
  }
};

const rules = {
  "react/react-in-jsx-scope": "off", // DISABLE the rule requiring React to be in scope
  "react/jsx-uses-react": "off", // Disable the rule requiring React to be in scope
  "react/prop-types": 1, // Enable prop-types enforcement
  quotes: ["error", "double"], // Enforce double quotes
  semi: ["error", "always"], // Enforce semicolons
  camelcase: "error", // Enforce camelCase for variables
  "id-match": [
    "error",
    "^[A-Z_]+$|^[a-z][a-zA-Z0-9]*$|^[A-Z][a-zA-Z0-9]*$", // Enforce ALL_CAPS, camelCase, or PascalCase
    {
      properties: true
    }
  ],
  "no-multiple-empty-lines": ["error", { max: 1 }], // Allow max one empty line
  // "padding-line-between-statements": [
  //   // Ensure one line after variable declarations
  //   "error",
  //   { blankLine: "always", prev: "var", next: "*" },
  //   { blankLine: "always", prev: "let", next: "*" },
  //   { blankLine: "always", prev: "const", next: "*" }
  // ],
  "max-lines": [
    "error",
    {
      max: 300, // Maximum number of lines in a file
      skipBlankLines: true, // Ignore blank lines
      skipComments: false // Count comments as lines
    }
  ]
};

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  { settings },
  { rules }
];
