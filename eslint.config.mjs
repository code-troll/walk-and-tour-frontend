import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Files inside the two branded trees that still carry hand-written colours.
 *
 * This list is the migration backlog for the redesign, and it is allowed to do
 * exactly one thing: get shorter. A file leaves the list when its colours come
 * from `app/design-system.css`; nothing may ever be added to it, because a new
 * file has no excuse — the tokens already exist.
 *
 * Why a list rather than a warning: a warning that fires 622 times is read by
 * nobody, and the point of the rule is that the *next* colour written by hand
 * fails the build. Grandfathering the 28 known offenders keeps the rule honest
 * from day one instead of "once we finish the migration".
 *
 * The backslashes are load-bearing: `[id]` is a character class in a glob, so a
 * dynamic-route path only matches when its brackets are escaped.
 */
const UNMIGRATED_FROM_BRAND_TOKENS = [
  "components/admin/TiptapHtmlEditor.tsx",
];

const NO_RAW_COLOUR =
  "Raw colour literal. The backoffice and the hotel portal may only use the " +
  "brand palette through the tokens in app/design-system.css — every value " +
  "there comes from the brand identity manual. If the shade you need does not " +
  "exist, it is not approved: take it to the designer, do not write it here.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: [
      "app/admin/**/*.{ts,tsx}",
      "app/hotel-portal/**/*.{ts,tsx}",
      "components/admin/**/*.{ts,tsx}",
      "components/hotel-portal/**/*.{ts,tsx}",
      // The tour editor's actual UI lives here, outside components/admin,
      // and was therefore uncovered while its 2,129-line client file was not.
      "components/tour-editor/**/*.{ts,tsx}",
    ],
    ignores: UNMIGRATED_FROM_BRAND_TOKENS,
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // "#fff", "#ffffff", "#ffffffff" — in a className, a style prop, anywhere.
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: NO_RAW_COLOUR,
        },
        {
          // The same, hidden inside a template literal.
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: NO_RAW_COLOUR,
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
